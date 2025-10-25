import React, { useState, useEffect } from "react";
import "./SchedulerPage.css";

const SchedulerPage = ({ schedule, scheduleNext, wsClient, connectionId, isOnline, availableStates }) => {
  const [activeTab, setActiveTab] = useState("daily");
  const [newTask, setNewTask] = useState({
    id: "",
    state: "",
    description: "",
    time: "",
    date: "", // Only for onetime
    day: "monday" // Only for weekly
  });
  const [editMode, setEditMode] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const daysOfWeek = [
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("/");
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString.replace(/(\d{4})\/(\d{2})\/(\d{2})/, "$1-$2-$3"));
    return date.toLocaleDateString();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setNewTask({
      id: "",
      state: "",
      description: "",
      time: "",
      date: "",
      day: "monday"
    });
    setEditMode(false);
    setEditingTask(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newTask.id || !newTask.state || !newTask.time) {
      alert("Please fill in all required fields (ID, State, Time)");
      return;
    }

    if (activeTab === "onetime" && !newTask.date) {
      alert("Please specify a date for one-time tasks");
      return;
    }

    const taskToSend = {
      id: newTask.id,
      state: newTask.state,
      time: newTask.time,
      description: newTask.description || ""
    };

    if (activeTab === "onetime") {
      taskToSend.date = newTask.date.replace(/-/g, "/");
    }

    if (wsClient) {
      let message;
      
      if (editMode) {
        // For editing, we need to send the complete information
        if (activeTab === "daily") {
          message = {
            action: "update",
            schedule_type: "daily",
            task: taskToSend,
            original_id: editingTask.id
          };
        } else if (activeTab === "weekly") {
          message = {
            action: "update",
            schedule_type: "weekly",
            day: newTask.day,
            task: taskToSend,
            original_id: editingTask.id
          };
        } else if (activeTab === "onetime") {
          message = {
            action: "update",
            schedule_type: "onetime",
            task: taskToSend,
            original_id: editingTask.id
          };
        }
      } else {
        // For adding new tasks
        if (activeTab === "daily") {
          message = {
            action: "add",
            schedule_type: "daily",
            task: taskToSend
          };
        } else if (activeTab === "weekly") {
          message = {
            action: "add",
            schedule_type: "weekly",
            day: newTask.day,
            task: taskToSend
          };
        } else if (activeTab === "onetime") {
          message = {
            action: "add",
            schedule_type: "onetime",
            task: taskToSend
          };
        }
      }

      wsClient.sendRequest("update_schedule", JSON.stringify(message));
      resetForm();
    }
  };

  const handleEditTask = (task, type, day = null) => {
    setEditMode(true);
    setEditingTask({ ...task, type, day });
    
    const taskToEdit = {
      id: task.id,
      state: task.state,
      description: task.description || "",
      time: task.time,
      day: day || "monday"
    };

    if (type === "onetime") {
      taskToEdit.date = formatDate(task.date);
    }

    setNewTask(taskToEdit);
    setActiveTab(type);
  };

  const handleDeleteTask = (task, type, day = null) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    if (wsClient) {
      let message;
      
      if (type === "daily") {
        message = {
          action: "delete",
          schedule_type: "daily",
          task_id: task.id
        };
      } else if (type === "weekly") {
        message = {
          action: "delete",
          schedule_type: "weekly",
          day: day,
          task_id: task.id
        };
      } else if (type === "onetime") {
        message = {
          action: "delete",
          schedule_type: "onetime",
          task_id: task.id
        };
      }

      wsClient.sendRequest("update_schedule", JSON.stringify(message));
    }
  };

  // Function to render the "Next Scheduled Task" section
  const renderNextScheduled = () => {
    if (!scheduleNext) return null;

    const { current_state, next_state, next_time, task_id, schedule_type, day_of_week } = scheduleNext;
    const nextTime = new Date(next_time);
    
    return (
      <div className="next-scheduled-container">
        <h3>Next Scheduled Task</h3>
        <div className="next-scheduled-info">
          <p><strong>Current State:</strong> {current_state}</p>
          <p><strong>Next State:</strong> {next_state}</p>
          <p><strong>Scheduled For:</strong> {nextTime.toLocaleString()}</p>
          <p><strong>Task ID:</strong> {task_id}</p>
          <p><strong>Schedule Type:</strong> {schedule_type}</p>
          {day_of_week && <p><strong>Day:</strong> {day_of_week}</p>}
        </div>
      </div>
    );
  };

  // Function to render the daily schedule tab
  const renderDailySchedule = () => {
    if (!schedule.daily || schedule.daily.length === 0) {
      return <p>No daily tasks scheduled.</p>;
    }

    // Sort by time
    const sortedTasks = [...schedule.daily].sort((a, b) => {
      return a.time.localeCompare(b.time);
    });

    return (
      <div className="schedule-list">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>State</th>
              <th>ID</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.time}</td>
                <td>{task.state}</td>
                <td>{task.id}</td>
                <td>{task.description || "-"}</td>
                <td>
                  <button 
                    className="edit-btn" 
                    onClick={() => handleEditTask(task, "daily")}
                    disabled={!isOnline}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDeleteTask(task, "daily")}
                    disabled={!isOnline}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Function to render the weekly schedule tab
  const renderWeeklySchedule = () => {
    const hasAnyWeeklyTasks = daysOfWeek.some(day => schedule.weekly[day] && schedule.weekly[day].length > 0);
    
    if (!hasAnyWeeklyTasks) {
      return <p>No weekly tasks scheduled.</p>;
    }

    return (
      <div className="weekly-schedule">
        {daysOfWeek.map((day) => {
          const dayTasks = schedule.weekly[day] || [];
          if (dayTasks.length === 0) return null;

          // Sort by time
          const sortedTasks = [...dayTasks].sort((a, b) => {
            return a.time.localeCompare(b.time);
          });

          return (
            <div key={day} className="day-schedule">
              <h3>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>State</th>
                    <th>ID</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map((task) => (
                    <tr key={`${day}-${task.id}`}>
                      <td>{task.time}</td>
                      <td>{task.state}</td>
                      <td>{task.id}</td>
                      <td>{task.description || "-"}</td>
                      <td>
                        <button 
                          className="edit-btn" 
                          onClick={() => handleEditTask(task, "weekly", day)}
                          disabled={!isOnline}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteTask(task, "weekly", day)}
                          disabled={!isOnline}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  };

  // Function to render the one-time schedule tab
  const renderOnetimeSchedule = () => {
    if (!schedule.onetime || schedule.onetime.length === 0) {
      return <p>No one-time tasks scheduled.</p>;
    }

    // Sort by date and time
    const sortedTasks = [...schedule.onetime].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return (
      <div className="schedule-list">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>State</th>
              <th>ID</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => (
              <tr key={task.id}>
                <td>{formatDateForDisplay(task.date)}</td>
                <td>{task.time}</td>
                <td>{task.state}</td>
                <td>{task.id}</td>
                <td>{task.description || "-"}</td>
                <td>
                  <button 
                    className="edit-btn" 
                    onClick={() => handleEditTask(task, "onetime")}
                    disabled={!isOnline}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDeleteTask(task, "onetime")}
                    disabled={!isOnline}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Function to render the form for adding/editing tasks
  const renderTaskForm = () => {
    return (
      <div className="task-form-container">
        <h3>{editMode ? "Edit Task" : "Add New Task"}</h3>
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="id">ID*:</label>
            <input
              type="text"
              id="id"
              name="id"
              value={newTask.id}
              onChange={handleInputChange}
              required
              disabled={!isOnline}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="state">State*:</label>
            <select
              id="state"
              name="state"
              value={newTask.state}
              onChange={handleInputChange}
              required
              disabled={!isOnline}
            >
              <option value="">Select a state</option>
              {availableStates.map(state => (
                <option key={state.name} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <input
              type="text"
              id="description"
              name="description"
              value={newTask.description || ""}
              onChange={handleInputChange}
              disabled={!isOnline}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="time">Time*:</label>
            <input
              type="time"
              id="time"
              name="time"
              value={newTask.time}
              onChange={handleInputChange}
              required
              disabled={!isOnline}
            />
          </div>
          
          {activeTab === "weekly" && (
            <div className="form-group">
              <label htmlFor="day">Day*:</label>
              <select
                id="day"
                name="day"
                value={newTask.day}
                onChange={handleInputChange}
                required
                disabled={!isOnline}
              >
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {activeTab === "onetime" && (
            <div className="form-group">
              <label htmlFor="date">Date*:</label>
              <input
                type="date"
                id="date"
                name="date"
                value={newTask.date}
                onChange={handleInputChange}
                required
                disabled={!isOnline}
              />
            </div>
          )}
          
          <div className="form-buttons">
            <button type="submit" className="submit-btn" disabled={!isOnline}>
              {editMode ? "Update Task" : "Add Task"}
            </button>
            {editMode && (
              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
                disabled={!isOnline}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="scheduler-page">
      <h2>Scheduler</h2>
      
      {/* Next Scheduled Task Section */}
      {renderNextScheduled()}
      
      <div className="scheduler-content">
        {/* Tab Navigation */}
        <div className="schedule-tabs">
          <button
            className={activeTab === "daily" ? "active" : ""}
            onClick={() => setActiveTab("daily")}
          >
            Daily
          </button>
          <button
            className={activeTab === "weekly" ? "active" : ""}
            onClick={() => setActiveTab("weekly")}
          >
            Weekly
          </button>
          <button
            className={activeTab === "onetime" ? "active" : ""}
            onClick={() => setActiveTab("onetime")}
          >
            One-time
          </button>
        </div>
        
        {/* Task Form Section */}
        {renderTaskForm()}
        
        {/* Schedule Display Section */}
        <div className="schedule-display">
          <h3>
            {activeTab === "daily" 
              ? "Daily Schedule" 
              : activeTab === "weekly" 
                ? "Weekly Schedule" 
                : "One-time Schedule"}
          </h3>
          
          {activeTab === "daily" && renderDailySchedule()}
          {activeTab === "weekly" && renderWeeklySchedule()}
          {activeTab === "onetime" && renderOnetimeSchedule()}
        </div>
      </div>
    </div>
  );
};

export default SchedulerPage;
Build a modern react app that is a control dashboard for multiple controller units. The name of the web app is "Dunebugger". USer needs to login to it to be able to see and control the units. Login is achived with Auth0 identity provider.
During the login phase, I will fetch from the IDentiyy provider a "wss_url" that I will use to establish a websocket connection with a hub. After the connection to the hub is established I will be able to add control of multiple units, as we said. Se there should be a control where I can add the unit. A control will open a popup module asking for the "unit code". Once the unit code is added, the unit code is used as a "group" name to be added to the "joined Group" of the websocket. 
For each unit/group added to the application, the application will add the unit as a "icon" rapresented with a nice "unit" icon labelled with the unit/group name.
When I select the unit by clicking on it, the dashboard will be filled up with information on the unit.

That sounds like an exciting project! Here's a breakdown of how we can structure the React app, including components, state management, and integration with Auth0 and WebSocket for real-time communication.

### Project Overview

- **Login with Auth0**: Use Auth0 to authenticate the user.
- **WebSocket Connection**: Establish a WebSocket connection using the URL fetched from the Auth0 token.
- **Unit Management**: Add and manage units, represented by icons, which can be clicked to show detailed information on the dashboard.
- **Popup for Unit Code**: A popup to enter the "unit code" that is added to a WebSocket group.

### Steps to Implement

1. **Setup Auth0** for authentication.
2. **Setup WebSocket connection** with the URL provided by Auth0.
3. **Dashboard UI**: Display units as icons, add and remove them, and show their details.
4. **Popup for entering unit code**.
5. **State Management**: Use React state to manage user data, WebSocket connection, and unit data.

Let’s get started with an outline of how the code structure could look:

---

### 1. **Setup Auth0 Authentication**
We'll integrate Auth0 for user authentication. You can use the `@auth0/auth0-react` package to make this easier.

First, install the Auth0 React SDK:
```bash
npm install @auth0/auth0-react
```

**AuthProvider.js** (Wrap your app with this to provide Auth0 context):
```jsx
import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter as Router } from 'react-router-dom';

const AuthProvider = ({ children }) => {
  return (
    <Auth0Provider
      domain="YOUR_AUTH0_DOMAIN"
      clientId="YOUR_AUTH0_CLIENT_ID"
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
      <Router>{children}</Router>
    </Auth0Provider>
  );
};

export default AuthProvider;
```

In your main entry point (`index.js`):
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import AuthProvider from './AuthProvider';

ReactDOM.render(
  <AuthProvider>
    <App />
  </AuthProvider>,
  document.getElementById('root')
);
```

---

### 2. **Setup WebSocket Connection**
After the user logs in, you will fetch the WebSocket URL from the Auth0 response and use it to establish the WebSocket connection.

**WebSocketContext.js** (Create a WebSocket context to manage the connection):
```jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children, wsUrl }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = new WebSocket(wsUrl);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [wsUrl]);

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};
```

---

### 3. **Dashboard Component**
The dashboard will display units as icons. Users can add units using a modal popup.

**Dashboard.js**:
```jsx
import React, { useState, useEffect } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useAuth0 } from '@auth0/auth0-react';
import UnitIcon from './UnitIcon';
import AddUnitModal from './AddUnitModal';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth0();
  const socket = useWebSocket();
  const [units, setUnits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'unit_added') {
          setUnits((prevUnits) => [...prevUnits, data.unit]);
        }
      };
    }
  }, [socket]);

  const handleAddUnit = (unitCode) => {
    if (socket) {
      socket.send(JSON.stringify({ type: 'join_group', unitCode }));
      setUnits((prevUnits) => [...prevUnits, { code: unitCode, name: `Unit ${unitCode}` }]);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.name}</h1>
      <button onClick={() => setIsModalOpen(true)} className="btn-primary">
        Add Unit
      </button>
      
      <div className="unit-icons">
        {units.map((unit) => (
          <UnitIcon key={unit.code} unit={unit} />
        ))}
      </div>

      {isModalOpen && <AddUnitModal onAddUnit={handleAddUnit} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default Dashboard;
```

**UnitIcon.js**:
```jsx
import React from 'react';

const UnitIcon = ({ unit }) => {
  return (
    <div className="unit-icon">
      <img src="/path/to/unit-icon.png" alt="unit" />
      <span>{unit.name}</span>
    </div>
  );
};

export default UnitIcon;
```

---

### 4. **Popup Modal for Adding Unit**
You can use a simple modal to let the user add a unit by entering the unit code.

**AddUnitModal.js**:
```jsx
import React, { useState } from 'react';

const AddUnitModal = ({ onAddUnit, onClose }) => {
  const [unitCode, setUnitCode] = useState('');

  const handleSubmit = () => {
    if (unitCode) {
      onAddUnit(unitCode);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Add Unit</h2>
        <input
          type="text"
          value={unitCode}
          onChange={(e) => setUnitCode(e.target.value)}
          placeholder="Enter Unit Code"
        />
        <button onClick={handleSubmit}>Add</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default AddUnitModal;
```

---

### 5. **Styling (Tailwind CSS)**
If you're using Tailwind CSS for styling, you can apply the utility classes accordingly. Here's a quick example:

**Tailwind CSS Setup** (if not set up yet):
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

In your `tailwind.config.js`:
```js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Then in your CSS (`index.css`):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### 6. **Main App Component**
Finally, your `App.js` will wire everything together.

**App.js**:
```jsx
import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { WebSocketProvider } from './WebSocketContext';
import Dashboard from './Dashboard';

const App = () => {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const [wsUrl, setWsUrl] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch WebSocket URL after login
      const fetchWsUrl = async () => {
        // Here, you should use the user information to get the WebSocket URL
        const url = 'ws://example.com/socket';  // Placeholder for actual URL
        setWsUrl(url);
      };
      fetchWsUrl();
    }
  }, [isAuthenticated]);

  return (
    <div className="app">
      {!isAuthenticated ? (
        <button onClick={() => loginWithRedirect()}>Login</button>
      ) : (
        <WebSocketProvider wsUrl={wsUrl}>
          <Dashboard />
        </WebSocketProvider>
      )}
    </div>
  );
};

export default App;
```

---

### Final Thoughts
With this setup, you’ll be able to:

- Authenticate users with Auth0.
- Fetch the WebSocket URL and manage WebSocket connections.
- Display the dashboard with units represented as icons.
- Open a modal to add units and control them.
  
Let me know if you'd like to dive deeper into any part or need any adjustments!
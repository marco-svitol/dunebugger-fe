import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Profile = ({ setWssUrl, setGroupName, setAvailableDevices, setSelectedDevice }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    if (isAuthenticated && user.wss_url) {
      setWssUrl(user.wss_url);
    }
    if (isAuthenticated && user.devices) {
      // ws_group_name is already an array like ['vialeborri', 'velasquez']
      const devices = Array.isArray(user.devices) ? user.devices : [user.devices];
      const validDevices = devices.filter(device => device && device.trim() !== '');
      setAvailableDevices(validDevices);
      
      // Set the first device as default selected
      if (validDevices.length > 0) {
        const defaultDevice = validDevices[0];
        setSelectedDevice(defaultDevice);
        setGroupName(defaultDevice);
      }
    } else if (isAuthenticated) {
      // User is authenticated but has no devices
      setAvailableDevices([]);
      setSelectedDevice("");
      setGroupName("");
    }
  }, [isAuthenticated, user, setWssUrl, setGroupName, setAvailableDevices, setSelectedDevice]);

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  // Check if user is authenticated but has no device associated
  // ws_group_name is an array like ['vialeborri', 'velasquez']
  const hasNoDevice = isAuthenticated && (!user.devices || 
    (Array.isArray(user.devices) ? user.devices.length === 0 : !user.devices));

  return (
    <>
      {hasNoDevice && (
        <span style={{ color: 'yellow', marginRight: '10px', fontSize: '14px' }}>
          No device associated with this account
        </span>
      )}
    </>
    // isAuthenticated && (
    //   <div>
    //     <img src={user.picture} alt={user.name} /> 
    //     <p>{user.name}</p> 
    //     <p>{user.nickname}</p> 
    //     <p>{user.email}</p> 
    //   </div>
    // )
  );
};

export default Profile;
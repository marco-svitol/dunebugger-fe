import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Profile = ({ setWssUrl, setGroupName }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    if (isAuthenticated && user.wss_url) {
      setWssUrl(user.wss_url);
    }
    if (isAuthenticated && user.ws_group_name) {
      setGroupName(user.ws_group_name);
    }
  }, [isAuthenticated, user, setWssUrl, setGroupName]);

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  return (
    isAuthenticated
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
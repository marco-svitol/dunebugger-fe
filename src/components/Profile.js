import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Profile = ({ setWssUrl }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    if (isAuthenticated && user.wss_url) {
      setWssUrl(user.wss_url);
    }
  }, [isAuthenticated, user, setWssUrl]);

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
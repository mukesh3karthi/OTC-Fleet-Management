import React from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";


const AssetsProtectedRoute = ({
  children,
}) => {

  const location =
    useLocation();


  const assetsLoggedIn =
    sessionStorage.getItem(
      "assetsLoggedIn"
    );


  /* =========================================
     ALLOW ACCESS
  ========================================= */

  if (
    assetsLoggedIn === "true"
  ) {

    return children;

  }


  /* =========================================
     NOT LOGGED IN

     Do NOT redirect to /assets,
     because /assets itself is protected.

     Go to dashboard and tell Sidebar
     to open Assets Login modal.
  ========================================= */

  return (

    <Navigate
      to="/dashboard"

      replace

      state={{
        openAssetsLogin: true,

        from:
          location.pathname,
      }}
    />

  );

};


export default AssetsProtectedRoute;
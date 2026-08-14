import {
  Navigate,
  useLocation,
} from "react-router-dom";

const Intercartingprotected = ({
  children,
}) => {
  const location = useLocation();

  const isLoggedIn =
    sessionStorage.getItem(
      "intercartingLoggedIn"
    ) === "true";

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/intercartingdash"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return children;
};

export default Intercartingprotected;

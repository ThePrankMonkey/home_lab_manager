import React, { useState, useEffect, useCallback } from "react";
import "./ServiceImageButton.css"; // We'll create this for styling
import { configData } from "../config";

const ServiceImageButton = ({ serviceName, action }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [status, setStatus] = useState("loading"); // 'loading', 'success', 'error'
  const [isLoadingClick, setIsLoadingClick] = useState(false);
  const [clickResponseStatus, setClickResponseStatus] = useState(null); // 'success', 'error'

  // Function to poll the image and status API
  const pollServiceStatus = useCallback(async () => {
    setStatus("loading");
    try {
      const url = `${configData.BASE_URL}/check/${serviceName}`;
      console.debug(`Checking on ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        console.error("Unable to Check");
        console.error(response);
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        console.log("test2");
      }
      console.log("test");
      const data = await response.json();
      console.debug(data);
      setImageUrl(data.imageUrl);
      setStatus(data.status === "running" ? "success" : "error"); // Assuming 'active' is a success status
    } catch (error) {
      console.error("Error polling service status:", error);
      setStatus("error");
    }
  }, [serviceName]);

  // Effect to initiate polling on component mount
  useEffect(() => {
    pollServiceStatus();
    const interval = setInterval(pollServiceStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval); // Clear interval on unmount
  }, [pollServiceStatus]);

  // Handle click on the component
  const handleClick = useCallback(async () => {
    setIsLoadingClick(true);
    setClickResponseStatus(null); // Reset flash status
    try {
      const url = `${configData.BASE_URL}/${action}/${serviceName}`;
      console.debug(`Acting ${action} on ${url}`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setClickResponseStatus("success");
      } else {
        setClickResponseStatus("error");
      }
    } catch (error) {
      console.error("Error during click action:", error);
      setClickResponseStatus("error");
    } finally {
      setIsLoadingClick(false);
      // Briefly show the flash and then clear it
      setTimeout(() => setClickResponseStatus(null), 1000);
    }
  }, [serviceName, action]);

  const renderContent = () => {
    if (status === "loading") {
      return <div className="spinner"></div>; // Simple loading spinner
    } else if (status === "error" && !imageUrl) {
      return <div className="error-message">Error loading service.</div>;
    } else {
      return imageUrl ? (
        <img
          src={imageUrl}
          alt={`${serviceName} service`}
          className="service-image"
        />
      ) : (
        <div className="no-image-placeholder">No image available</div>
      );
    }
  };

  const getButtonClassName = () => {
    let className = "service-image-button";
    if (clickResponseStatus === "success") {
      className += " flash-green";
    } else if (clickResponseStatus === "error") {
      className += " flash-red";
    }
    return className;
  };

  return (
    <div className={getButtonClassName()} onClick={handleClick}>
      {renderContent()}
      {isLoadingClick && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default ServiceImageButton;

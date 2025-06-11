import React, { useState, useEffect, useCallback } from "react";
import { configData } from "../config";
import ServiceImageButton from "./ServiceImageButton";

const ServiceImageButtonFactory = (compose, action) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // useEffect hook to perform data fetching when the component mounts.
    // An async IIFE (Immediately Invoked Function Expression) is used for the async operation.
    const fetchServices = async () => {
      try {
        console.debug(compose); // To use later
        const url = `${configData.BASE_URL}/list_services`;
        const response = await fetch(url);
        if (!response.ok) {
          console.error("Unable to Check");
          console.error(response);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setServices(data); // Update the state with the fetched services
      } catch (err) {
        console.error("Failed to fetch services:", err);
        setError("Failed to load services. Please try again later."); // Set error state
      } finally {
        setLoading(false); // Set loading to false regardless of success or failure
      }
    };

    fetchServices(); // Call the fetch function
  }, []); // Empty dependency array means this effect runs only once after the initial render

  // Render logic based on loading, error, and services state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Loading services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-48 text-red-600 text-lg">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen flex flex-col items-center">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 text-center">
        Restart Containers
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center max-w-7xl mx-auto w-full">
        {/* Map over the services array and render a ServiceImageButton for each service */}
        {services.map((service, index) => (
          <ServiceImageButton
            key={index}
            serviceName={service}
            action={"restart"}
          />
        ))}
      </div>
    </div>
  );
};

export default ServiceImageButtonFactory;

import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import "../styles/services.css";

export default function Services() {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);

  const [services, setServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("");

  const servicesCollection = collection(db, "services");

  // Load user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("userRole"); // must match Login.jsx
    setCurrentUserRole(role || "");
  }, []);

  // Fetch Services
  const fetchServices = async () => {
    const data = await getDocs(servicesCollection);
    setServices(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Add or Update Service
  const saveService = async (e) => {
    e.preventDefault();

    if (!title || !details || !price) {
      alert("Please fill all fields");
      return;
    }

    if (editingService) {
      const serviceDoc = doc(db, "services", editingService.id);
      await updateDoc(serviceDoc, {
        title,
        details,
        price: Number(price),
        available,
      });
      setEditingService(null);
    } else {
      await addDoc(servicesCollection, {
        title,
        details,
        price: Number(price),
        available,
      });
    }

    setTitle("");
    setDetails("");
    setPrice("");
    setAvailable(true);
    fetchServices();
  };

  // Toggle Availability
  const toggleAvailability = async (id, currentValue) => {
    const serviceDoc = doc(db, "services", id);
    await updateDoc(serviceDoc, { available: !currentValue });
    fetchServices();
  };

  // Delete service (Admin only)
  const deleteService = async (id) => {
    if (currentUserRole !== "admin") {
      alert("Only admin can delete services.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this service?")) {
      const serviceDoc = doc(db, "services", id);
      await deleteDoc(serviceDoc);
      fetchServices();
    }
  };

  // Edit service
  const editService = (service) => {
    setEditingService(service);
    setTitle(service.title);
    setDetails(service.details);
    setPrice(service.price);
    setAvailable(service.available);
  };

  const cancelEdit = () => {
    setEditingService(null);
    setTitle("");
    setDetails("");
    setPrice("");
    setAvailable(true);
  };

  return (
    <div className="services-container">
      <h1>Services</h1>

      {/* Add/Edit Service Form */}
      <form className="service-form" onSubmit={saveService}>
        <input
          type="text"
          placeholder="Service Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Service Details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        ></textarea>

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <div className="wrap">
          <label className="availability-checkbox">Available</label>
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />
        </div>

        <button type="submit">
          {editingService ? "Update Service" : "Add Service"}
        </button>
        {editingService && (
          <button type="button" onClick={cancelEdit} className="cancel-btn">
            Cancel
          </button>
        )}
      </form>

      {/* Service List */}
      <div className="service-list">
        {services.map((service) => (
          <div
            className={`service-card ${
              service.available ? "available" : "not-available"
            }`}
            key={service.id}
          >
            <h2>{service.title}</h2>
            <p>{service.details}</p>
            <p>
              <strong>Price:</strong> ₱{service.price}
            </p>
            <p className="status">
              Status:{" "}
              <span className={service.available ? "green" : "red"}>
                {service.available ? "Available" : "Not Available"}
              </span>
            </p>

            <div className="service-actions">
              <button
                onClick={() => toggleAvailability(service.id, service.available)}
              >
                {service.available ? "Mark Unavailable" : "Mark Available"}
              </button>

              <button className="edit-btn" onClick={() => editService(service)}>
                Edit
              </button>

              {currentUserRole === "admin" && (
                <button
                  className="delete-btn"
                  onClick={() => deleteService(service.id)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// pages/pricing.js
import React from 'react'; // It's good practice to import React

const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbz3WJmHNJ2h8Yj1rm2tc_mXj6JNCYz8T-yOmg9kC6aKgpAAuXmH5Z3DNZQF8ecGZUGw/exec';

export async function getStaticProps() {
  try {
    const response = await fetch(GOOGLE_SHEET_API_URL);
    if (!response.ok) {
      // Handle non-2xx responses from the API
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    // You might need to transform the data here to match your serviceCategories structure
    // This example assumes the Google Sheet returns an array of objects
    const serviceCategories = data.map(item => ({
      name: item.categoryName,
      description: item.categoryDescription,
      services: [{ // Assuming a one-to-one mapping for simplicity as in your original code
        name: item.serviceName,
        price: item.servicePrice,
        details: item.serviceDetails,
      }],
    }));

    return {
      props: {
        serviceCategories,
      },
      revalidate: 3600, // Re-generate every hour
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    // Return an empty array or handle the error as you see fit
    return { props: { serviceCategories: [] } };
  }
}

export default function PricingPage({ serviceCategories }) {
  // Add a check to prevent errors if serviceCategories is empty or not an array
  if (!Array.isArray(serviceCategories) || serviceCategories.length === 0) {
    return <p>Could not load pricing data. Please try again later.</p>;
  }

  // This is the crucial part: fill the return statement with your UI
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Our Services & Pricing</h1>
      {serviceCategories.map((category, index) => (
        <div key={index} style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem' }}>
          <h2>{category.name}</h2>
          <p>{category.description}</p>
          {category.services.map((service, serviceIndex) => (
            <div key={serviceIndex} style={{ marginTop: '1rem' }}>
              <h3>{service.name}</h3>
              <p><strong>Price:</strong> {service.price}</p>
              {service.details && <p><em>{service.details}</em></p>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
export const fetchProjects = async () => {
  try {
    const token = localStorage.getItem("keycloak_token")
      ? JSON.parse(localStorage.getItem("keycloak_token")).access_token
      : "";

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL
      }/api/project`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch projects");
    }

    const data = await response.json();
    return data.projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

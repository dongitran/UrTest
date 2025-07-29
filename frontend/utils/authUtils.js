export const isAdminOrManager = (user) => {
  return (
    user &&
    user.roles &&
    (user.roles.includes("ADMIN") || user.roles.includes("MANAGER"))
  );
};

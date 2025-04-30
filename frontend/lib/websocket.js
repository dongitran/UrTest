export const handleEventData = (eventData, callback) => {
  try {
    const data = JSON.parse(eventData);
    if (callback) {
      callback(data);
    }
  } catch (error) {}
};

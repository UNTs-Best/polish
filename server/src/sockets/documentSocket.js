export const initDocumentSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("join-doc", (docId) => socket.join(docId));

    socket.on("edit", ({ docId, changes }) => {
      socket.to(docId).emit("update", changes);
    });

    socket.on("disconnect", () => {});
  });
};

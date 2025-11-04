import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    ownerId: { type: String, required: true },          // Auth0 or Azure B2C user ID
    blobName: { type: String, required: true },          // unique name in Azure container
    blobUrl: { type: String, required: true },           // full public or SAS URL
    size: { type: Number, default: 0 },                  // bytes
    mimeType: { type: String },                          // e.g. application/pdf
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
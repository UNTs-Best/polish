import mongoose from "mongoose";

const aiInteractionSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    userId: { type: String }, // Auth0 user sub
    prompt: { type: String, required: true },
    response: { type: String },
    model: { type: String },
    tokens: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    cost: { type: Number, default: 0 },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("AIInteraction", aiInteractionSchema);



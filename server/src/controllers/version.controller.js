import VersionService from "../services/version.service.js";

/**
 * Get all versions for a document
 */
export const getDocumentVersions = async (req, res) => {
  try {
    const { documentId } = req.params;
    const ownerId = req.user?.sub || "anonymous";

    const versionService = new VersionService();
    const versions = await versionService.getDocumentVersions(documentId);

    // Filter versions by owner (for security)
    const userVersions = versions.filter(v => v.ownerId === ownerId);

    res.json(userVersions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get a specific version
 */
export const getVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    const ownerId = req.user?.sub || "anonymous";

    const versionService = new VersionService();
    const version = await versionService.getVersionById(versionId);

    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    // Check ownership
    if (version.ownerId !== ownerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(version);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get version history summary
 */
export const getVersionHistory = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { limit } = req.query;
    const ownerId = req.user?.sub || "anonymous";

    const versionService = new VersionService();

    // Verify document ownership
    const document = await versionService.getLatestVersion(documentId);
    if (document && document.ownerId !== ownerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const history = await versionService.getVersionHistory(documentId, parseInt(limit) || 50);
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Restore document to a specific version
 */
export const restoreVersion = async (req, res) => {
  try {
    const { documentId, versionId } = req.params;
    const ownerId = req.user?.sub || "anonymous";

    const versionService = new VersionService();

    // Verify document ownership
    const document = await versionService.getLatestVersion(documentId);
    if (document && document.ownerId !== ownerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const restoredVersion = await versionService.restoreVersion(documentId, versionId, ownerId);
    res.json({
      message: "Document restored successfully",
      version: restoredVersion
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Compare two versions
 */
export const compareVersions = async (req, res) => {
  try {
    const { versionId1, versionId2 } = req.params;
    const ownerId = req.user?.sub || "anonymous";

    const versionService = new VersionService();
    const comparison = await versionService.compareVersions(versionId1, versionId2);

    // Verify ownership
    if (comparison.version1.ownerId !== ownerId || comparison.version2.ownerId !== ownerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(comparison);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

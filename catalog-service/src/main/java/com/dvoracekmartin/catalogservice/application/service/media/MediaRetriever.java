package com.dvoracekmartin.catalogservice.application.service.media;

import java.util.List;

public interface MediaRetriever {
    /**
     * Retrieves media content as a byte array.
     * @param objectKey The full key of the object to retrieve.
     * @param bucketName The name of the bucket.
     * @return The media content as a byte array, or null if not found.
     */
    byte[] retrieveMedia(String objectKey, String bucketName);

    /**
     * Lists all media keys within a specific folder (prefix).
     * @param folderName The name of the folder (prefix) to list.
     * @param bucketName The name of the bucket.
     * @return A list of object keys.
     */
    List<String> listMediaKeysInFolder(String folderName, String bucketName);

    /**
     * Evicts cached folder data. (Not implemented in this version).
     * @param folderName The name of the folder to evict.
     */
    void evictFolderCache(String folderName);

    /**
     * Evicts cached media data. (Not implemented in this version).
     * @param objectKey The key of the object to evict.
     */
    void evictMediaCache(String objectKey);
}

package com.dvoracekmartin.catalogservice.application.service.media;

import java.util.List;

public interface MediaRetriever {
    byte[] retrieveMedia(String objectKey, String bucketName);

    List<String> listMediaKeysInFolder(String folderName, String bucketName);

    void evictFolderCache(String folderName);

    void evictMediaCache(String objectKey);
}

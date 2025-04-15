package com.dvoracekmartin.catalogservice.domain.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
public class MinIOMediaRetriever {

    @Value("${minio.endpoint}")
    private String minioEndpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket-name}")
    private String bucketName;

    private S3Client s3Client;

    @PostConstruct
    private void initializeClient() {
        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(minioEndpoint))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .forcePathStyle(true)
                .build();
    }

    @Cacheable(value = "mediaContent", key = "#objectKey")
    public byte[] retrieveMedia(String objectKey) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .build();

            ResponseBytes<GetObjectResponse> responseBytes = s3Client.getObjectAsBytes(getObjectRequest);
            return responseBytes.asByteArray();

        } catch (NoSuchKeyException e) {
            log.warn("Object '{}' not found in bucket '{}'", objectKey, bucketName);
            return null;
        } catch (S3Exception e) {
            log.error("Error retrieving object '{}' from bucket '{}': {}", objectKey, bucketName, e.getMessage());
            return null;
        }
    }

    @Cacheable(value = "folderContents", key = "#folderName")
    public List<String> listMediaKeysInFolder(String folderName) {
        ListObjectsV2Request listObjectsRequest = ListObjectsV2Request.builder()
                .bucket(bucketName)
                .prefix(folderName.endsWith("/") ? folderName : folderName + "/")
                .build();

        List<String> keys = new ArrayList<>();
        ListObjectsV2Response listObjectsResponse;

        do {
            listObjectsResponse = s3Client.listObjectsV2(listObjectsRequest);
            for (S3Object s3Object : listObjectsResponse.contents()) {
                keys.add(s3Object.key());
            }
            listObjectsRequest = listObjectsRequest.toBuilder()
                    .continuationToken(listObjectsResponse.nextContinuationToken())
                    .build();
        } while (listObjectsResponse.isTruncated());

        return keys.stream()
                .filter(key -> !key.equals(folderName) && !key.equals(folderName + "/")) // Exclude the folder itself
                .collect(Collectors.toList());
    }

    @CacheEvict(value = "folderContents", key = "#folderName")
    public void evictFolderCache(String folderName) {
        log.info("Evicting cache for folder: {}", folderName);
    }

    @CacheEvict(value = "mediaContent", key = "#objectKey")
    public void evictMediaCache(String objectKey) {
        log.info("Evicting cache for media: {}", objectKey);
    }
}

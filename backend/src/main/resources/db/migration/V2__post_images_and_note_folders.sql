-- UniConnect v2: image attachments for student posts and subject folders for study notes.
-- Applied by Flyway on top of V1 in production; Hibernate validates the same mapping.

CREATE TABLE post_images (
    id BIGINT NOT NULL AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(150) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_post_images_storage_key UNIQUE (storage_key),
    CONSTRAINT fk_post_images_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    INDEX idx_post_images_post (post_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE note_folders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(80) NOT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_note_folders_name UNIQUE (name),
    CONSTRAINT fk_note_folders_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_note_folders_creator (created_by)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

ALTER TABLE notes ADD COLUMN folder_id BIGINT NULL;

ALTER TABLE notes ADD INDEX idx_notes_folder (folder_id);

ALTER TABLE notes
    ADD CONSTRAINT fk_notes_folder FOREIGN KEY (folder_id) REFERENCES note_folders (id) ON DELETE SET NULL;

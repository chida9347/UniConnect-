-- UniConnect initial schema (MySQL 8+)
-- Applied automatically by Flyway in production.

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    university_id VARCHAR(40) NOT NULL,
    email VARCHAR(160) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    academic_year VARCHAR(30) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_university_id UNIQUE (university_id),
    INDEX idx_users_role (role)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE posts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(180) NOT NULL,
    content TEXT NOT NULL,
    author_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_posts_author (author_id),
    INDEX idx_posts_created (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE notes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    description TEXT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    content_type VARCHAR(150) NOT NULL,
    file_size BIGINT NOT NULL,
    uploader_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_notes_storage_key UNIQUE (storage_key),
    CONSTRAINT fk_notes_uploader FOREIGN KEY (uploader_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_notes_uploader (uploader_id),
    INDEX idx_notes_subject (subject),
    INDEX idx_notes_created (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE questions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_questions_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_questions_author (author_id),
    INDEX idx_questions_created (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE answers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    content TEXT NOT NULL,
    question_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_answers_question (question_id),
    INDEX idx_answers_author (author_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE faculty (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    email VARCHAR(160) NOT NULL,
    specialization VARCHAR(180) NOT NULL,
    contact_info VARCHAR(200) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_faculty_department (department),
    INDEX idx_faculty_name (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE opportunities (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(30) NOT NULL,
    organization VARCHAR(150) NOT NULL,
    application_url VARCHAR(500) NOT NULL,
    deadline DATE NOT NULL,
    posted_by_id BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_opportunities_posted_by FOREIGN KEY (posted_by_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_opportunities_category (category),
    INDEX idx_opportunities_deadline (deadline),
    INDEX idx_opportunities_created (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    real_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    id_card VARCHAR(30),
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL,
    INDEX idx_users_role (role)
);

CREATE TABLE IF NOT EXISTS books (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NOT NULL,
    publisher VARCHAR(100),
    isbn VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(100),
    stock INT NOT NULL,
    available_stock INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_books_category (category)
);

CREATE TABLE IF NOT EXISTS book_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS borrow_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    borrow_time DATETIME NOT NULL,
    due_time DATETIME NOT NULL,
    return_time DATETIME,
    status VARCHAR(20) NOT NULL,
    renew_count INT NOT NULL,
    overdue_fee DECIMAL(10,2) DEFAULT 0,
    INDEX idx_borrow_user_status (user_id, status),
    INDEX idx_borrow_status_due_time (status, due_time),
    INDEX idx_borrow_book_id (book_id),
    CONSTRAINT fk_borrow_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_borrow_book FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE TABLE IF NOT EXISTS overdue_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    borrow_record_id BIGINT NOT NULL,
    overdue_days INT NOT NULL,
    overdue_fee DECIMAL(10,2) NOT NULL,
    created_at DATETIME NOT NULL,
    INDEX idx_overdue_user_created_at (user_id, created_at),
    INDEX idx_overdue_borrow_record (borrow_record_id),
    CONSTRAINT fk_overdue_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_overdue_book FOREIGN KEY (book_id) REFERENCES books(id),
    CONSTRAINT fk_overdue_borrow FOREIGN KEY (borrow_record_id) REFERENCES borrow_records(id)
);

CREATE TABLE IF NOT EXISTS admin_operation_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_id BIGINT NOT NULL,
    operation VARCHAR(255) NOT NULL,
    detail TEXT,
    result VARCHAR(20),
    duration_ms BIGINT,
    client_ip VARCHAR(64),
    user_agent VARCHAR(512),
    created_at DATETIME NOT NULL,
    INDEX idx_admin_log_created_at (created_at),
    INDEX idx_admin_log_admin_created_at (admin_id, created_at),
    CONSTRAINT fk_admin_log_user FOREIGN KEY (admin_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS system_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value VARCHAR(100) NOT NULL,
    description VARCHAR(255)
);

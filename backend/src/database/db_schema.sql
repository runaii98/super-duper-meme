-- Database: run_ai_db

-- Table: Users
CREATE TABLE IF NOT EXISTS Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(255) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastLogin TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Instances
CREATE TABLE IF NOT EXISTS Instances (
    InstanceID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    ProviderInstanceID VARCHAR(255) NULL,
    InstanceName VARCHAR(255) NULL,
    Provider VARCHAR(50) NOT NULL COMMENT 'e.g., AWS, GCP',
    Region VARCHAR(100) NOT NULL,
    PublicIpAddress VARCHAR(45) NULL,
    PrivateIpAddress VARCHAR(45) NULL,
    Status VARCHAR(50) NOT NULL COMMENT 'e.g., PENDING, RUNNING, STOPPED, TERMINATED',
    InstanceType VARCHAR(100) NULL COMMENT 'Provider-specific instance type, e.g., t2.micro, e2-medium',
    OsImage VARCHAR(255) NULL,
    CPUCores INT NULL,
    GPUCount INT NULL DEFAULT 0,
    GPUType VARCHAR(100) NULL,
    RAM_GB DECIMAL(10, 2) NULL,
    Storage_GB DECIMAL(10, 2) NULL,
    StorageType VARCHAR(50) NULL COMMENT 'e.g., SSD, HDD, gp3',
    BillingType ENUM('OnDemand', 'Spot') NOT NULL,
    NetworkEgressLimit_Mbps INT NULL,
    NetworkIngressLimit_Mbps INT NULL,
    SecurityGroupIDs VARCHAR(1000) NULL COMMENT 'Comma-separated list of security group IDs',
    SshKeyName VARCHAR(255) NULL,
    StartedAt TIMESTAMP NULL DEFAULT NULL,
    StoppedAt TIMESTAMP NULL DEFAULT NULL,
    TerminatedAt TIMESTAMP NULL DEFAULT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 
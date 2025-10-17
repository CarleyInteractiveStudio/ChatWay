-- Users Table: Extends auth.users with public profile information.
CREATE TABLE users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    sex VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    languages TEXT[],
    profile_image_url TEXT,
    extra_image_url_1 TEXT,
    extra_image_url_2 TEXT,
    role VARCHAR(50) DEFAULT 'user' NOT NULL, -- user, moderator, admin, developer
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friend Requests Table
CREATE TABLE friend_requests (
    id SERIAL PRIMARY KEY,
    sender_id UUID REFERENCES users(id) NOT NULL,
    receiver_id UUID REFERENCES users(id) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, accepted, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- Couples Table
CREATE TABLE couples (
    id SERIAL PRIMARY KEY,
    user1_id UUID REFERENCES users(id) NOT NULL UNIQUE,
    user2_id UUID REFERENCES users(id) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, accepted, rejected
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups Table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    owner_id UUID REFERENCES users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    max_members INT DEFAULT 50 NOT NULL,
    posts_per_day INT DEFAULT 10 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations Table
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Participants Table
CREATE TABLE conversation_participants (
    conversation_id INT REFERENCES conversations(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
);

-- Messages Table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES conversations(id) NOT NULL,
    sender_id UUID REFERENCES users(id) NOT NULL,
    content TEXT,
    media_url TEXT, -- For images, audio, etc.
    media_type VARCHAR(50), -- image, audio, sticker
    replied_to_message_id INT REFERENCES messages(id), -- Self-referencing key for replies
    status VARCHAR(50) DEFAULT 'enviado' NOT NULL, -- enviado, visto
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games Table
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    developer_id UUID REFERENCES users(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    game_url TEXT NOT NULL, -- Link to the web game
    version VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, approved, rejected
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Posts Table (for "Mundo" feed)
CREATE TABLE system_posts (
    id SERIAL PRIMARY KEY,
    author_id UUID REFERENCES users(id), -- Can be NULL for pure system messages
    post_type VARCHAR(50) DEFAULT 'system' NOT NULL, -- system, admin, infidelity_report
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports Table
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reporter_id UUID REFERENCES users(id) NOT NULL,
    reported_user_id UUID REFERENCES users(id),
    reported_message_id INT REFERENCES messages(id),
    reported_post_id INT REFERENCES system_posts(id),
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' NOT NULL, -- open, in_review, closed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Actions Table
CREATE TABLE admin_actions (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES users(id) NOT NULL,
    action VARCHAR(255) NOT NULL, -- e.g., 'ban_user', 'approve_game', 'publish_report'
    target_user_id UUID,
    target_game_id INT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium Subscriptions Table
CREATE TABLE premium_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
    subscription_level VARCHAR(50) NOT NULL, -- e.g., 'basic', 'advanced'
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ
);

# API Documentation

This document provides an overview of the API routes available in the application.

## Authentication

All API routes require authentication using NextAuth.js. The authentication is handled through the session, so you don't need to include any authentication tokens in your requests.

## Repository Routes

### List Repositories

```
GET /api/repos
```

Lists all repositories for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of repositories per page (default: 100)
- `sort` (optional): Sort by 'created', 'updated', 'pushed', or 'full_name' (default: 'updated')
- `direction` (optional): Sort direction 'asc' or 'desc' (default: 'desc')

**Response:**
```json
{
  "repos": [
    {
      "id": 123456789,
      "name": "repo-name",
      "fullName": "username/repo-name",
      "owner": {
        "id": 12345,
        "login": "username",
        "avatarUrl": "https://avatars.githubusercontent.com/u/12345"
      },
      "stars": 10,
      "updatedAt": "2023-01-01T00:00:00Z",
      "private": false,
      "description": "Repository description",
      "language": "TypeScript",
      "defaultBranch": "main"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 100
  }
}
```

### Get Repository

```
GET /api/repos/{repoId}
```

Gets details for a specific repository.

**Response:**
```json
{
  "id": 123456789,
  "name": "repo-name",
  "fullName": "username/repo-name",
  "owner": {
    "id": 12345,
    "login": "username",
    "avatarUrl": "https://avatars.githubusercontent.com/u/12345"
  },
  "stars": 10,
  "updatedAt": "2023-01-01T00:00:00Z",
  "createdAt": "2022-01-01T00:00:00Z",
  "private": false,
  "description": "Repository description",
  "language": "TypeScript",
  "defaultBranch": "main",
  "url": "https://github.com/username/repo-name",
  "apiUrl": "https://api.github.com/repos/username/repo-name",
  "topics": ["topic1", "topic2"],
  "hasIssues": true,
  "hasProjects": true,
  "hasWiki": true,
  "forksCount": 5,
  "openIssuesCount": 2,
  "watchersCount": 3,
  "license": {
    "key": "mit",
    "name": "MIT License",
    "url": "https://api.github.com/licenses/mit"
  }
}
```

### Get Repository Commits

```
GET /api/repos/{repoId}/commits
```

Gets commits for a specific repository.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of commits per page (default: 100)
- `from` or `since` (optional): Start date for commits (ISO format)
- `to` or `until` (optional): End date for commits (ISO format)
- `sha` (optional): SHA or branch name to start listing commits from

**Response:**
```json
[
  {
    "sha": "6dcb09b5b57875f334f61aebed695e2e4193db5e",
    "message": "Fix all the bugs",
    "author": {
      "name": "User Name",
      "email": "user@example.com",
      "date": "2023-01-01T00:00:00Z"
    },
    "url": "https://github.com/username/repo-name/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e",
    "stats": {
      "additions": 10,
      "deletions": 5,
      "total": 15
    }
  }
]
```

### Get Repository Contributors

```
GET /api/repos/{repoId}/contributors
```

Gets contributors for a specific repository.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of contributors per page (default: 100)
- `top` (optional): Number of top contributors to return (default: 0, returns all)

**Response:**
```json
[
  {
    "id": 12345,
    "login": "username",
    "avatarUrl": "https://avatars.githubusercontent.com/u/12345",
    "contributions": 100,
    "url": "https://github.com/username",
    "type": "User"
  }
]
```

### Get Repository Statistics

```
GET /api/repos/{repoId}/stats
```

Gets statistics for a specific repository.

**Response:**
```json
{
  "id": 123456789,
  "name": "repo-name",
  "fullName": "username/repo-name",
  "description": "Repository description",
  "stars": 10,
  "forks": 5,
  "watchers": 3,
  "openIssues": 2,
  "defaultBranch": "main",
  "createdAt": "2022-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z",
  "pushedAt": "2023-01-01T00:00:00Z",
  "language": "TypeScript",
  "languages": {
    "TypeScript": 100
  },
  "isPrivate": false,
  "hasIssues": true,
  "hasProjects": true,
  "hasWiki": true,
  "commitFrequency": 2.5,
  "totalCommits": 100,
  "totalContributors": 5,
  "topContributors": [
    {
      "login": "username",
      "contributions": 50,
      "avatarUrl": "https://avatars.githubusercontent.com/u/12345"
    }
  ],
  "latestCommit": {
    "sha": "6dcb09b5b57875f334f61aebed695e2e4193db5e",
    "message": "Fix all the bugs",
    "author": {
      "name": "User Name",
      "date": "2023-01-01T00:00:00Z"
    },
    "url": "https://github.com/username/repo-name/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e"
  },
  "owner": {
    "id": 12345,
    "login": "username",
    "avatarUrl": "https://avatars.githubusercontent.com/u/12345",
    "url": "https://github.com/username"
  }
}
```

### Get Repository Changelogs

```
GET /api/repos/{repoId}/changelogs
```

Gets changelogs for a specific repository.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of changelogs per page (default: 10)
- `status` (optional): Filter by status ('processing', 'completed', 'failed')

**Response:**
```json
{
  "repoId": "123456789",
  "repoName": "username/repo-name",
  "changelogs": [
    {
      "id": "cl-1234567890",
      "repoId": 123456789,
      "repoName": "username/repo-name",
      "fromDate": "2023-01-01",
      "toDate": "2023-01-31",
      "commitCount": 50,
      "generatedAt": "2023-02-01T00:00:00Z",
      "processedAt": "2023-02-01T00:05:00Z",
      "status": "completed",
      "createdAt": "2023-02-01T00:00:00Z",
      "hasProcessedChangelog": true
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

## Changelog Routes

### List Changelogs

```
GET /api/changelogs
```

Lists all changelogs for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of changelogs per page (default: 10)
- `repoId` (optional): Filter by repository ID
- `status` (optional): Filter by status ('processing', 'completed', 'failed')

**Response:**
```json
{
  "changelogs": [
    {
      "id": "cl-1234567890",
      "repoId": 123456789,
      "repoName": "username/repo-name",
      "fromDate": "2023-01-01",
      "toDate": "2023-01-31",
      "commitCount": 50,
      "generatedAt": "2023-02-01T00:00:00Z",
      "processedAt": "2023-02-01T00:05:00Z",
      "status": "completed",
      "createdAt": "2023-02-01T00:00:00Z",
      "hasProcessedChangelog": true
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Create Changelog

```
POST /api/changelogs
```

Creates a new changelog.

**Request Body:**
```json
{
  "repoId": 123456789,
  "fromDate": "2023-01-01",
  "toDate": "2023-01-31",
  "commits": [
    {
      "sha": "6dcb09b5b57875f334f61aebed695e2e4193db5e",
      "message": "Fix all the bugs",
      "author": {
        "name": "User Name",
        "email": "user@example.com",
        "date": "2023-01-01T00:00:00Z"
      },
      "url": "https://github.com/username/repo-name/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e"
    }
  ],
  "options": {
    "includeCommits": true,
    "groupByType": true
  }
}
```

**Response:**
```json
{
  "id": "cl-1234567890",
  "repoId": 123456789,
  "repoName": "username/repo-name",
  "fromDate": "2023-01-01",
  "toDate": "2023-01-31",
  "commitCount": 1,
  "generatedAt": "2023-02-01T00:00:00Z",
  "processedAt": null,
  "status": "processing",
  "createdAt": "2023-02-01T00:00:00Z"
}
```

### Get Changelog

```
GET /api/changelogs/{changelogId}
```

Gets details for a specific changelog.

**Response:**
```json
{
  "id": "cl-1234567890",
  "repoId": 123456789,
  "repoName": "username/repo-name",
  "fromDate": "2023-01-01",
  "toDate": "2023-01-31",
  "commitCount": 50,
  "generatedAt": "2023-02-01T00:00:00Z",
  "processedAt": "2023-02-01T00:05:00Z",
  "status": "completed",
  "processedChangelog": "# Changelog\n\n## Features\n\n- Added new feature\n\n## Bug Fixes\n\n- Fixed critical bug",
  "createdAt": "2023-02-01T00:00:00Z",
  "options": {
    "includeCommits": true,
    "groupByType": true
  }
}
```

### Update Changelog

```
PUT /api/changelogs/{changelogId}
```

Updates a specific changelog.

**Request Body:**
```json
{
  "action": "process",
  "processedChangelog": "# Changelog\n\n## Features\n\n- Added new feature\n\n## Bug Fixes\n\n- Fixed critical bug"
}
```

**Response:**
```json
{
  "id": "cl-1234567890",
  "repoId": 123456789,
  "repoName": "username/repo-name",
  "status": "completed",
  "processedAt": "2023-02-01T00:05:00Z",
  "message": "Changelog processing completed",
  "processedChangelog": "# Changelog\n\n## Features\n\n- Added new feature\n\n## Bug Fixes\n\n- Fixed critical bug"
}
```

### Delete Changelog

```
DELETE /api/changelogs/{changelogId}
```

Deletes a specific changelog.

**Response:**
```json
{
  "success": true,
  "id": "cl-1234567890",
  "deletedAt": "2023-02-01T00:10:00Z"
}
```

## Implementation Details

### Octokit Integration

All GitHub API interactions use Octokit.js instead of raw fetch calls. This provides:

- Better error handling
- Rate limit management
- More structured API
- Type safety
- Easier to maintain and extend

The GitHub utility module (`lib/github.ts`) centralizes all GitHub API interactions and provides helper functions for common operations.

### Database Integration

Changelogs are stored in a database using Supabase. The database schema includes:

- `id`: UUID primary key
- `user_id`: User ID (from GitHub)
- `repo_id`: Repository ID (from GitHub)
- `repo_name`: Repository name
- `from_date`: Start date for the changelog
- `to_date`: End date for the changelog
- `commit_count`: Number of commits in the changelog
- `raw_data`: JSON data with commits and options
- `processed_changelog`: Processed changelog content
- `status`: Status of the changelog ('processing', 'completed', 'failed')
- `generated_at`: Timestamp when the changelog was generated
- `processed_at`: Timestamp when the changelog was processed
- `created_at`: Timestamp when the record was created

The database utility module (`lib/db/index.ts`) centralizes all database interactions and provides functions for CRUD operations. 
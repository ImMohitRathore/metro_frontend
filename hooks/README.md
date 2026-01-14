# API Hooks Documentation

This directory contains reusable React hooks for making API calls.

## Available Hooks

### `useApi<T>`

Generic hook for making GET requests to any API endpoint.

**Usage:**

```tsx
import { useApi } from "@/hooks/useApi";

function MyComponent() {
  const { data, loading, error, execute, reset } = useApi<User[]>(
    "/api/users",
    {
      immediate: true, // Fetch on mount
      onSuccess: (data) => console.log("Success:", data),
      onError: (error) => console.error("Error:", error),
      transform: (data) =>
        data.map((user) => ({
          ...user,
          fullName: `${user.firstName} ${user.lastName}`,
        })),
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={execute}>Refresh</button>
    </div>
  );
}
```

### `useMutation<TData, TVariables>`

Hook for POST, PUT, DELETE, and PATCH requests.

**Usage:**

```tsx
import { useMutation } from "@/hooks/useApi";

function CreateUser() {
  const { mutate, loading, error, data } = useMutation<User, CreateUserInput>(
    "/api/users",
    {
      onSuccess: (data) => console.log("User created:", data),
      onError: (error) => console.error("Error:", error),
    }
  );

  const handleSubmit = async (formData: CreateUserInput) => {
    await mutate(formData, "POST");
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

### `useDropdown`

Specialized hook for fetching dropdown data. Automatically filters inactive items.

**Usage:**

```tsx
import { useDropdown } from "@/hooks/useDropdown";

function MyForm() {
  const {
    data: complexions,
    loading,
    error,
  } = useDropdown("/api/dropdown/complexions");

  if (loading) return <div>Loading...</div>;

  return (
    <select>
      {complexions?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
```

### Pre-configured Dropdown Hooks

For convenience, there are pre-configured hooks for common dropdowns:

```tsx
import {
  useComplexions,
  useReligions,
  useCastes,
  useGotras,
  useHeights,
  useMaritalStatuses,
  useQualifications,
  useFoodPreferences,
  useStates,
  useCities,
} from "@/hooks/useDropdown";

function MyComponent() {
  const { data: complexions } = useComplexions();
  const { data: religions } = useReligions();
  // ... etc
}
```

## API Configuration

The API base URL is configured in `/lib/api.ts`. You can set it via environment variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

If not set, it defaults to `http://localhost:5000`.

## Direct API Calls

You can also use the `api` object directly for one-off API calls:

```tsx
import { api } from "@/lib/api";

// GET request
const response = await api.get("/api/dropdown/complexions");

// POST request
const newUser = await api.post("/api/users", {
  name: "John",
  email: "john@example.com",
});

// PUT request
const updated = await api.put("/api/users/1", { name: "Jane" });

// DELETE request
await api.delete("/api/users/1");
```

## Error Handling

All hooks return an `error` object with the following structure:

```typescript
interface ApiError {
  message: string;
  error?: string;
  status?: number;
}
```

## Response Format

The API is expected to return responses in this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

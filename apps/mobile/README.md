# Karaa mobile shell

Task 5 provides an Expo Router shell that accepts only email/password, retains only the server-issued session in `expo-secure-store`, and routes by the role returned by `/v1/auth/login`. Project data and project actions remain API-authoritative: they do not work as ordinary offline data and are not queued for later synchronization.

## Local API address

Set `EXPO_PUBLIC_API_BASE_URL` to an address reachable from the device. The Android-emulator default is `http://10.0.2.2:4310`.

## Native deep links

The Android app registers the `karaa` scheme. With a native build installed, role workspaces use real URL paths:

```text
karaa://customer
karaa://employee
karaa://management
```

Authorization is still enforced after navigation: a valid session for a different role is redirected to its own workspace, and a missing, malformed, or expired session goes to login.

## Install record

The shell was created with:

```bash
npx create-expo-app@latest apps/mobile --template blank-typescript
```

After inspecting the generated manifest, only code/test dependencies needed by this increment were added:

```bash
npx expo install expo-router expo-secure-store zod
npm install --save-dev @testing-library/react-native@13.3.3 react-test-renderer@19.2.3 jest-expo @types/jest
```

The Employee field-record workflow adds `expo-image-picker`, `expo-location`, and `expo-crypto`:

- the image library opens only after the Employee explicitly chooses **Add evidence photo**;
- device location is requested only after **Use device location**;
- the PC audience workflow can use a separately labelled **Presentation simulator — not a real location** state;
- selected evidence and field data are sent as one authenticated multipart request, and the UI confirms saving only after the API accepts it.

`socket.io-client` remains deferred. The current mobile product reads canonical API state; it does not pretend to maintain a client-side realtime cache.

## Verify

```bash
npm test --workspace=@karaa/mobile
npm run typecheck --workspace=@karaa/mobile
```

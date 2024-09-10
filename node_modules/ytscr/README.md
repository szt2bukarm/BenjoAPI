# YTSCR

YTSCR (YouTube Scraper) is a versatile tool designed for efficiently scraping YouTube channels' videos, streams, shorts, and video information.

## Features

- **Efficiency**: YTSCR offers rapid scraping capabilities, facilitating quick retrieval of desired data.
- **User-Friendly**: With its intuitive interface, YTSCR is accessible to both novice and experienced users alike.
- **Minimal Dependencies**: YTSCR is built with minimal dependencies, ensuring a streamlined experience for integration into various projects.

## Usage

Below is a straightforward example demonstrating how to utilize YTSCR to retrieve videos from a YouTube channel using TypeScript:

```typescript
import { getVideos } from 'ytscr';

async function main() {
  console.log(await getVideos('@MrBeast'));
}

main();
```

While YTSCR primarily supports ESM/ModernJS, it can also be used with JavaScript. However, please note that JavaScript usage is limited to environments supporting ESM/ModernJS.

```javascript
import { getVideos } from 'ytscr';

async function main() {
  console.log(await getVideos('@MrBeast'));
}

main();
```

## API Reference

- ### `getVideos(channelId: string) => Promise<Video[] | { message: string }>`

  - Retrieves an array of videos from a specific channel. Returns a message object if there was any error.

- ### `getStreams(channelId: string) => Promise<Stream[] | { message: string }>`

  - Retrieves an array of live streams from a specific channel. Returns a message object if there was any error.

- ### `getShorts(channelId: string) => Promise<Short[] | { message: string }>`

  - Retrieves an array of short videos from a specific channel. Returns a message object if there was any error.

- ### `getAll(channelId: string) => Promise<AllResponse>`

  - Retrieves three different arrays of videos, streams, and shorts from a specific channel. Returns an empty array for each if there was any error.

- ### `getInfo(videoId: string) => Promise<Info | {message: string}>`
  - Retrieves an object containing information of the provided video id. Returns a message object if there was any error.

## Contribution

Contributions to YTSCR are welcome and encouraged! If you'd like to contribute to the project, please follow these guidelines:

1. Fork the YTSCR repository on GitHub.
2. Make your changes in a feature branch.
3. Ensure that your code adheres to the project's coding style and guidelines.
4. Write clear, concise commit messages.
5. Submit a pull request detailing your changes, along with a brief description of the modifications.

Thank you for considering contributing to YTSCR! Your help is greatly appreciated.

### Note for Contributors

Please note that this project was initialized in [Bun](https://bun.sh). Make sure you have Bun installed in your machine so you can contribute without any runtime errors.

export function devLog(...logs: any[]) {
  if (process.env.NODE_ENV == 'development') {
    console.log(...logs);
  }
}

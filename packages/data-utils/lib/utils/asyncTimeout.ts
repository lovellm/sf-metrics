export default function asyncTimeout(ms: number) {
  return new Promise<true>((resolve) => setTimeout(resolve, ms));
}

declare module "@/components/ui/*" {
  // biome-ignore lint/suspicious/noExplicitAny: A
  const component: any;
  export default component;
  export type { component };
}

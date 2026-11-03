import "@johnmorrisdotca/kuni/element/define";

export function Country({ code = "JP" }: { code?: string }) {
  return <kuni-card code={code} fields="name codes capital" />;
}

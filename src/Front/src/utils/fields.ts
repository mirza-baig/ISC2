import { Field } from '@sitecore-jss/sitecore-jss-nextjs';

export const parseFieldsFromURLString = <T>(field?: Field<string>): T => {
  if (!field?.value) {
    return {} as T;
  }

  const params = new URLSearchParams(field.value.toString());

  return [...params.entries()].reduce(
    (accum, [key, value]) => ({ ...accum, [key]: value }),
    {} as T
  );
};

type ReplaceTerm = { replace: string; with: string };

export const replaceValues = (value: string, replaceTerms: ReplaceTerm[]) =>
  replaceTerms.reduce(
    (accum: string, replaceTerm) => accum.replaceAll(replaceTerm.replace, replaceTerm.with),
    value
  );

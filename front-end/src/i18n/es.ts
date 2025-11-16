import EN from "./en";

export type TranslationKey = keyof typeof EN;

const ES: Partial<Record<TranslationKey, string>> = {};

export default ES;

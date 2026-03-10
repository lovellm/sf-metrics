import { DropdownOption } from "@spcs-apps/page-parts";

export interface LanguageOption extends DropdownOption {
  iso?: string;
}

/** normalizes locales for comparison by making them upercase and removing all non-letter non-number characters */
export function normalizeLocale(input?: string) {
  if (!input) {
    return "";
  }
  return input.toUpperCase().replaceAll(/[^A-Z0-9]/g, "");
}

/** extends a DropdownOption by adding an "iso" field if able */
export default function languageOptions(options: DropdownOption[]): LanguageOption[] {
  if (!options) {
    return options;
  }
  return options.map((option) => {
    return {
      iso: getIsoCode(option.value, option.label),
      value: option.value,
      label: option.label,
    };
  });
}

/** attempts to figure out an ISO language code for the given value.
 * if no match and label also given, repeats for label.
 */
const getIsoCode = (value: string, label?: string): string => {
  if (!value) {
    return "";
  }
  switch (value) {
    case "English (United States)":
      return "en_US";
    case "French (France)":
      return "fr_FR";
    case "Portuguese (Brazil)":
      return "pt_BR";
    case "German (Germany)":
      return "de_DE";
    case "Simplified Chinese":
      return "zh_CN";
    case "Spanish (Neutral)":
      return "es_ES";
    case "Dutch (Netherlands)":
      return "nl_NL";
    case "Norwegian (Norway)":
      return "no_NO";
    case "Japanese (Japan)":
      return "ja_JP";
    case "French (Canada)":
      return "fr_CA";
    case "Polish (Poland)":
      return "pl_PL";
    case "Swedish (Sweden)":
      return "sv_SE";
    case "Turkish (Türkiye)":
    case "Turkish (Turkiye)":
      return "tr_TR";
    case "Korean (Korea)":
      return "kr_KR";
    case "Russian (Russia)":
      return "ru_RU";
    case "Italian (Italy)":
      return "it_IT";
  }

  const lang = iso639List.find(([name, code]) => {
    if (value.toUpperCase() === name.toUpperCase()) {
      return true;
    }
    if (normalizeLocale(value) === normalizeLocale(code)) {
      return true;
    }
    return false;
  });
  if (lang) {
    return lang[1];
  }

  if (label) {
    return getIsoCode(label);
  }
  return "";
};

/** returns the language option value closest to the browser primary language */
export function getLanguageOption(options?: LanguageOption[]): string {
  if (!options) {
    return "";
  }
  const lang = navigator.language;
  const prefer = normalizeLocale(lang);
  const prefix = prefer.substring(0, 2);
  let match = "";
  let fallback = "";

  const potentials = options.filter((opt) => {
    const normalized = normalizeLocale(opt.iso);
    // as a fallback for no matches, use the first english one
    if (!fallback && normalized.startsWith("EN")) {
      fallback = opt.value;
    }
    // exact match, set it
    if (normalized === prefer) {
      match = opt.value;
      return true;
    } else if (normalized.startsWith(prefix)) {
      return true;
    }
    return false;
  });
  // exact locale match
  if (match) {
    return match;
  }
  // no language matches, use fallback
  if (potentials.length === 0) {
    return fallback;
  }
  // only one matching locale, use it
  if (potentials.length === 1) {
    return potentials[0].value;
  }
  // multiple matches, just take the first
  return potentials[0].value;
}

/** list of iso-639-1 languages. index[0] is language name, index[1] is language code */
const iso639List: [string, string][] = [
  ["Abkhazian", "ab"],
  ["Afar", "aa"],
  ["Afrikaans", "af"],
  ["Akan", "ak"],
  ["Albanian", "sq"],
  ["Amharic", "am"],
  ["Arabic", "ar"],
  ["Aragonese", "an"],
  ["Armenian", "hy"],
  ["Assamese", "as"],
  ["Avaric", "av"],
  ["Avestan", "ae"],
  ["Aymara", "ay"],
  ["Azerbaijani", "az"],
  ["Bambara", "bm"],
  ["Bashkir", "ba"],
  ["Basque", "eu"],
  ["Belarusian", "be"],
  ["Bengali (Bangla)", "bn"],
  ["Bihari", "bh"],
  ["Bislama", "bi"],
  ["Bosnian", "bs"],
  ["Breton", "br"],
  ["Bulgarian", "bg"],
  ["Burmese", "my"],
  ["Catalan", "ca"],
  ["Chamorro", "ch"],
  ["Chechen", "ce"],
  ["Chichewa, Chewa, Nyanja", "ny"],
  ["Chinese", "zh"],
  ["Chinese (Simplified)", "zh-CN"],
  ["Chinese (Traditional)", "zh-TW"],
  ["Chuvash", "cv"],
  ["Cornish", "kw"],
  ["Corsican", "co"],
  ["Cree", "cr"],
  ["Croatian", "hr"],
  ["Czech", "cs"],
  ["Danish", "da"],
  ["Divehi, Dhivehi, Maldivian", "dv"],
  ["Dutch", "nl"],
  ["Dzongkha", "dz"],
  ["English", "en"],
  ["Esperanto", "eo"],
  ["Estonian", "et"],
  ["Ewe", "ee"],
  ["Faroese", "fo"],
  ["Fijian", "fj"],
  ["Finnish", "fi"],
  ["French", "fr"],
  ["Fula, Fulah, Pulaar, Pular", "ff"],
  ["Galician", "gl"],
  ["Gaelic (Scottish)", "gd"],
  ["Gaelic (Manx)", "gv"],
  ["Georgian", "ka"],
  ["German", "de"],
  ["Greek", "el"],
  ["Greenlandic", "kl"],
  ["Guarani", "gn"],
  ["Gujarati", "gu"],
  ["Haitian Creole", "ht"],
  ["Hausa", "ha"],
  ["Hebrew", "he"],
  ["Herero", "hz"],
  ["Hindi", "hi"],
  ["Hiri Motu", "ho"],
  ["Hungarian", "hu"],
  ["Icelandic", "is"],
  ["Ido", "io"],
  ["Igbo", "ig"],
  ["Indonesian", "id, in"],
  ["Interlingua", "ia"],
  ["Interlingue", "ie"],
  ["Inuktitut", "iu"],
  ["Inupiak", "ik"],
  ["Irish", "ga"],
  ["Italian", "it"],
  ["Japanese", "ja"],
  ["Javanese", "jv"],
  ["Kalaallisut, Greenlandic", "kl"],
  ["Kannada", "kn"],
  ["Kanuri", "kr"],
  ["Kashmiri", "ks"],
  ["Kazakh", "kk"],
  ["Khmer", "km"],
  ["Kikuyu", "ki"],
  ["Kinyarwanda (Rwanda)", "rw"],
  ["Kirundi", "rn"],
  ["Kyrgyz", "ky"],
  ["Komi", "kv"],
  ["Kongo", "kg"],
  ["Korean", "ko"],
  ["Kurdish", "ku"],
  ["Kwanyama", "kj"],
  ["Lao", "lo"],
  ["Latin", "la"],
  ["Latvian (Lettish)", "lv"],
  ["Limburgish ( Limburger)", "li"],
  ["Lingala", "ln"],
  ["Lithuanian", "lt"],
  ["Luga-Katanga", "lu"],
  ["Luganda, Ganda", "lg"],
  ["Luxembourgish", "lb"],
  ["Manx", "gv"],
  ["Macedonian", "mk"],
  ["Malagasy", "mg"],
  ["Malay", "ms"],
  ["Malayalam", "ml"],
  ["Maltese", "mt"],
  ["Maori", "mi"],
  ["Marathi", "mr"],
  ["Marshallese", "mh"],
  ["Moldavian", "mo"],
  ["Mongolian", "mn"],
  ["Nauru", "na"],
  ["Navajo", "nv"],
  ["Ndonga", "ng"],
  ["Northern Ndebele", "nd"],
  ["Nepali", "ne"],
  ["Norwegian", "no"],
  ["Norwegian bokmål", "nb"],
  ["Norwegian nynorsk", "nn"],
  ["Nuosu", "ii"],
  ["Occitan", "oc"],
  ["Ojibwe", "oj"],
  ["Old Church Slavonic, Old Bulgarian", "cu"],
  ["Oriya", "or"],
  ["Oromo (Afaan Oromo)", "om"],
  ["Ossetian", "os"],
  ["Pāli", "pi"],
  ["Pashto, Pushto", "ps"],
  ["Persian (Farsi)", "fa"],
  ["Polish", "pl"],
  ["Portuguese", "pt"],
  ["Punjabi (Eastern)", "pa"],
  ["Quechua", "qu"],
  ["Romansh", "rm"],
  ["Romanian", "ro"],
  ["Russian", "ru"],
  ["Sami", "se"],
  ["Samoan", "sm"],
  ["Sango", "sg"],
  ["Sanskrit", "sa"],
  ["Serbian", "sr"],
  ["Serbo-Croatian", "sh"],
  ["Sesotho", "st"],
  ["Setswana", "tn"],
  ["Shona", "sn"],
  ["Sichuan Yi", "ii"],
  ["Sindhi", "sd"],
  ["Sinhalese", "si"],
  ["Siswati", "ss"],
  ["Slovak", "sk"],
  ["Slovenian", "sl"],
  ["Somali", "so"],
  ["Southern Ndebele", "nr"],
  ["Spanish", "es"],
  ["Sundanese", "su"],
  ["Swahili (Kiswahili)", "sw"],
  ["Swati", "ss"],
  ["Swedish", "sv"],
  ["Tagalog", "tl"],
  ["Tahitian", "ty"],
  ["Tajik", "tg"],
  ["Tamil", "ta"],
  ["Tatar", "tt"],
  ["Telugu", "te"],
  ["Thai", "th"],
  ["Tibetan", "bo"],
  ["Tigrinya", "ti"],
  ["Tonga", "to"],
  ["Tsonga", "ts"],
  ["Turkish", "tr"],
  ["Turkmen", "tk"],
  ["Twi", "tw"],
  ["Uyghur", "ug"],
  ["Ukrainian", "uk"],
  ["Urdu", "ur"],
  ["Uzbek", "uz"],
  ["Venda", "ve"],
  ["Vietnamese", "vi"],
  ["Volapük", "vo"],
  ["Wallon", "wa"],
  ["Welsh", "cy"],
  ["Wolof", "wo"],
  ["Western Frisian", "fy"],
  ["Xhosa", "xh"],
  ["Yiddish", "yi"],
  ["Yoruba", "yo"],
  ["Zhuang, Chuang", "za"],
  ["Zulu", "zu"],
];

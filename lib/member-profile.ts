export const countryCallingCodes = [
  { value: "+886", label: "台灣 +886" },
  { value: "+852", label: "香港 +852" },
  { value: "+853", label: "澳門 +853" },
  { value: "+86", label: "中國 +86" },
  { value: "+81", label: "日本 +81" },
  { value: "+82", label: "韓國 +82" },
  { value: "+65", label: "新加坡 +65" },
  { value: "+60", label: "馬來西亞 +60" },
  { value: "+63", label: "菲律賓 +63" },
  { value: "+66", label: "泰國 +66" },
  { value: "+84", label: "越南 +84" },
  { value: "+1", label: "美國／加拿大 +1" },
  { value: "+44", label: "英國 +44" },
  { value: "+61", label: "澳洲 +61" },
  { value: "+64", label: "紐西蘭 +64" },
] as const;

export const genderOptions = [
  { value: "female", label: "女" },
  { value: "male", label: "男" },
  { value: "non_binary", label: "非二元／其他" },
  { value: "prefer_not_to_say", label: "不透露" },
] as const;

export type Gender = (typeof genderOptions)[number]["value"];

export function isCallingCode(value: string) {
  return countryCallingCodes.some((option) => option.value === value);
}

export function isGender(value: string): value is Gender {
  return genderOptions.some((option) => option.value === value);
}

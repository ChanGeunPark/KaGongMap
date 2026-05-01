const BASE_NICKNAMES = [
  "카공러",
  "라떼파",
  "집중러",
  "몰입러",
  "코딩러",
  "문서작업러",
  "디자이너",
  "독서러",
  "노트북러",
  "야간작업러",
];

export function generateRandomNickname(): string {
  const base =
    BASE_NICKNAMES[Math.floor(Math.random() * BASE_NICKNAMES.length)];
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `${base}${suffix}`;
}

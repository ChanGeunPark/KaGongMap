import Script from "next/script";
import MainApp from "@/components/MainApp";

export default function Home() {
  return (
    <>
      <Script
        id="naver-maps-sdk"
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
        strategy="afterInteractive"
      />
      <MainApp />
    </>
  );
}

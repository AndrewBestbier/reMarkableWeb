import "../styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import Script from "next/script";

function MyApp({ Component, pageProps }: AppProps) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Script
        id="chatwoot"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(d,t) {
        var BASE_URL="https://app.chatwoot.com";
        var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
        g.src=BASE_URL+"/packs/js/sdk.js";
        g.defer = true;
        g.async = true;
        s.parentNode.insertBefore(g,s);
        g.onload=function(){
          window.chatwootSDK.run({
            websiteToken: 'K64HwjaoQKXvBZot2bKQz3UT',
            baseUrl: BASE_URL
          })
        }
      })(document,"script");`,
        }}
      />
      <Toaster />
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}

export default MyApp;

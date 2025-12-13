import React, { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDownloadLinks } from "./useDownloadLinks";
import styles from "./InstallButton.module.css";

interface InstallButtonProps {
  className?: string;
}

const InstallButton: React.FC<InstallButtonProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const { primaryDownload, browserDisplayName } = useDownloadLinks();
  const textRef = useRef<SVGTextElement>(null);
  const [svgWidth, setSvgWidth] = useState(380);
  const [rectWidth, setRectWidth] = useState(376);

  const buttonText = `${t("downloads.installNow")} (${t(
    "downloads.for"
  )} ${browserDisplayName})`;

  useEffect(() => {
    if (textRef.current) {
      const textBBox = textRef.current.getBBox();
      // Logo takes ~74px, text starts at x=74, add padding on right (20px)
      const calculatedWidth = textBBox.width + 74 + 20;
      const minWidth = 200; // Minimum button width
      const finalWidth = Math.max(calculatedWidth, minWidth);
      setSvgWidth(finalWidth);
      setRectWidth(finalWidth - 4); // Account for 2px border on each side
    }
  }, [buttonText]);

  return (
    <a
      href={primaryDownload.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.installButton} ${className}`}
      aria-label={buttonText}
    >
      <svg
        width={svgWidth}
        height="80"
        viewBox={`0 0 ${svgWidth} 80`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.installButtonImage}
      >
        <rect
          x="2"
          y="2"
          width={rectWidth}
          height="76"
          rx="18"
          fill="url(#paint0_linear_40_34)"
        />
        <rect x="2" y="2" width={rectWidth} height="76" rx="18" />
        <g clipPath="url(#clip0_40_34)">
          <path
            d="M47.042 57.2223C56.5169 57.2223 64.1979 49.5413 64.1979 40.0664C64.1979 30.5914 56.5169 22.9104 47.042 22.9104C37.567 22.9104 29.886 30.5914 29.886 40.0664C29.886 49.5413 37.567 57.2223 47.042 57.2223Z"
            fill="white"
          />
          <path
            d="M57.9591 43.1857C57.9591 37.1559 53.0713 32.2678 47.0418 32.2678C41.0124 32.2678 36.1243 37.1559 36.1243 43.1857H39.2433C39.2433 38.8786 42.735 35.3874 47.0415 35.3874C51.348 35.3874 54.8398 38.8786 54.8398 43.1857"
            fill="black"
            fillOpacity="0.1"
          />
          <path
            d="M47.8218 48.1762C51.0949 48.1762 53.7483 45.5229 53.7483 42.2497C53.7483 38.9766 51.0949 36.3232 47.8218 36.3232C44.5486 36.3232 41.8953 38.9766 41.8953 42.2497C41.8953 45.5229 44.5486 48.1762 47.8218 48.1762Z"
            fill="black"
            fillOpacity="0.1"
          />
          <path
            d="M47.042 46.4606C50.5735 46.4606 53.4365 43.5977 53.4365 40.0661C53.4365 36.5345 50.5735 33.6716 47.042 33.6716C43.5104 33.6716 40.6475 36.5345 40.6475 40.0661C40.6475 43.5977 43.5104 46.4606 47.042 46.4606Z"
            fill="url(#paint1_linear_40_34)"
          />
          <path
            d="M62.6381 32.2678C58.3445 23.6289 47.8607 20.1065 39.2215 24.4001C36.5278 25.7388 34.2254 27.7506 32.5376 30.2405L39.5562 42.4054C38.2633 38.2975 40.5465 33.919 44.6544 32.6264C45.3769 32.3991 46.1288 32.2784 46.8861 32.2681"
            fill="url(#paint2_linear_40_34)"
          />
          <path
            d="M32.5375 30.2407C27.1656 38.2541 29.3071 49.1044 37.3202 54.4763C39.7995 56.1383 42.6631 57.1374 45.6381 57.3785L52.9684 44.9014C50.2276 48.2233 45.3127 48.6944 41.9906 45.9533C40.8621 45.0228 40.0183 43.7935 39.5558 42.4059"
            fill="url(#paint3_linear_40_34)"
          />
          <path
            d="M45.6382 57.3788C55.2581 58.1059 63.6458 50.8969 64.3731 41.2773C64.6078 38.1734 64.0087 35.0632 62.6378 32.2686H46.8861C51.1926 32.2882 54.6683 35.7957 54.648 40.1025C54.64 41.845 54.0487 43.5345 52.9684 44.9017"
            fill="url(#paint4_linear_40_34)"
          />
          <path
            d="M32.5376 30.2407L39.5562 42.4056C39.0363 40.6561 39.1465 38.7796 39.8675 37.1029L32.8492 29.7727"
            fill="url(#paint5_linear_40_34)"
          />
          <path
            d="M45.6381 57.3787L52.9683 44.9016C51.8117 46.2808 50.2137 47.2174 48.4453 47.5527L45.3259 57.3787"
            fill="url(#paint6_linear_40_34)"
          />
          <path
            d="M62.638 32.2678H46.886C48.0573 32.2734 49.2123 32.5426 50.2652 33.0557C51.3182 33.5687 52.2421 34.3124 52.9683 35.2314L62.9501 32.7358"
            fill="url(#paint7_linear_40_34)"
          />
        </g>
        <text
          ref={textRef}
          x="74"
          y="43"
          fill="white"
          fontSize="18"
          textAnchor="start"
          dominantBaseline="middle"
          fontFamily="Arial, sans-serif"
          style={{ visibility: "hidden" }}
        >
          {buttonText}
        </text>
        <text
          x="74"
          y="43"
          fill="white"
          fontSize="18"
          textAnchor="start"
          dominantBaseline="middle"
          fontFamily="Arial, sans-serif"
        >
          {buttonText}
        </text>
        <defs>
          <linearGradient
            id="paint0_linear_40_34"
            x1={svgWidth / 2}
            y1="0"
            x2={svgWidth / 2}
            y2="80"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00B445" />
            <stop offset="1" stopColor="#006F2A" />
          </linearGradient>
          <linearGradient
            id="paint1_linear_40_34"
            x1="47.0456"
            y1="33.6615"
            x2="47.0456"
            y2="46.4612"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#81B4E0" />
            <stop offset="1" stopColor="#0C5A94" />
          </linearGradient>
          <linearGradient
            id="paint2_linear_40_34"
            x1="47.5878"
            y1="22.5981"
            x2="47.5878"
            y2="36.7908"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F06B59" />
            <stop offset="1" stopColor="#DF2227" />
          </linearGradient>
          <linearGradient
            id="paint3_linear_40_34"
            x1="33.8276"
            y1="52.4825"
            x2="41.0017"
            y2="40.6295"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#388B41" />
            <stop offset="1" stopColor="#4CB749" />
          </linearGradient>
          <linearGradient
            id="paint4_linear_40_34"
            x1="57.8605"
            y1="53.7434"
            x2="50.2183"
            y2="35.3398"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#E4B022" />
            <stop offset="0.3" stopColor="#FCD209" />
          </linearGradient>
          <linearGradient
            id="paint5_linear_40_34"
            x1="36.2026"
            y1="41.9379"
            x2="36.2026"
            y2="29.4611"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopOpacity="0.15" />
            <stop offset="0.3" stopOpacity="0.06" />
            <stop offset="1" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient
            id="paint6_linear_40_34"
            x1="53.4242"
            y1="45.967"
            x2="44.8464"
            y2="54.7009"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopOpacity="0.15" />
            <stop offset="0.3" stopOpacity="0.06" />
            <stop offset="1" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient
            id="paint7_linear_40_34"
            x1="53.2999"
            y1="48.4808"
            x2="54.5478"
            y2="36.1592"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopOpacity="0.15" />
            <stop offset="0.3" stopOpacity="0.06" />
            <stop offset="1" stopOpacity="0.03" />
          </linearGradient>
          <clipPath id="clip0_40_34">
            <rect
              width="36"
              height="36"
              fill="white"
              transform="translate(29 22)"
            />
          </clipPath>
        </defs>
      </svg>
    </a>
  );
};

export default InstallButton;

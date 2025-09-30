import React from "react";
import textDictionary from "./text-dictionary.json"

interface TextToIconProps {
  text: string;
}
interface ElementIconProps {
  hash: number;
}

export const TextToIcon: React.FC<TextToIconProps> = ({ text }) => {
  const icons: { [key: string]: { className?: string, title?: string, replacement: string } } = textDictionary;

  // エスケープ済みの文字列配列を作る
  const regexIcons: string[] = Object.keys(icons).map((value) => {
    return value.replace(/\[/g, "\\[")
  })
  .map((value) => {
    return value.replace(/\]/g, "\\]")
  });

  // パターンにマッチする部分をspanタグで囲む
  const regex = new RegExp(`(${regexIcons.join("|")})`, "g");

  const parts = text.split(regex).map((part, index) => {
    const icon = icons[part];
    if (icon && icon.replacement == "br"){
      return <br key={index}/>
    } else if (icon && icon.className) {
      return (
        <span key={index} className={icon.className} title={icon.title}>{icon.replacement}</span>
      );
    } else if (icon) {
      return (
        <span key={index}>{icon.replacement}</span>
      );
    } else {
      return (
        <span key={index}>{part}</span>
      );
    }
  });

  return <>{parts}</>;
};

export const ElementIcon: React.FC<ElementIconProps> = ({ hash }) => {
  switch (hash) {
      case 2:
          return <span className="arc keys" title="アーク">&#xe143;</span>;
      case 3:
          return <span className="solar keys" title="ソーラー">&#xe140;</span>;
      case 4:
          return <span className="void keys" title="ボイド">&#xe144;</span>;
      case 6:
          return <span className="stasis keys" title="ステイシス">&#xe139;</span>;
      case 7:
          return <span className="strand keys" title="ストランド">&#xef0e;</span>;
      default:
          return <></>;
  }
};

export const damageType = (num: number) => {
  switch (num) {
    case 1:
      return "sort_kinetic";
    case 2:
      return "sort_arc";
    case 3:
      return "sort_solar";
    case 4:
      return "sort_void";
    case 6:
      return "sort_stasis";
    case 7:
      return "sort_strand";
    default:
      return "";
  }
};

export const ammoType = (num: number) => {
  switch (num) {
    case 1:
      return "primary";
    case 2:
      return "special";
    case 3:
      return "heavy";
    default:
      return "";
  }
};

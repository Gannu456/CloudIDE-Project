// languageIcons.js
import {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiPython,
//   SiJava,
  SiCplusplus,
//   SiC,
//   SiCsharp,
//   SiGo,
//   SiRuby,
//   SiPhp,
//   SiRust,
//   SiSwift,
//   SiKotlin,
//   SiDart,
  SiHtml5,
  SiCss3,
//   SiSass,
//   SiLess,
  SiJson,
//   SiYaml,
//   SiMarkdown,
//   SiBash,
//   SiDocker,
//   SiGit,
//   SiMongodb,
//   SiMysql,
//   SiPostgresql,
//   SiGraphql,
//   SiFirebase,
//   SiRedux,
//   SiSvg,
//   SiDotenv,
//   SiPowershell,
//   SiLua,
//   SiPerl,
//   SiR,
//   SiScala,
//   SiHaskell,
//   SiElixir,
//   SiErlang,
//   SiClojure,
//   SiObjectivec,
//   SiMatlab,
//   SiFortran,
//   SiAssemblyscript,
} from "react-icons/si";
import { FiFile, FiCode } from "react-icons/fi";

const languageMap = [
  // Web
  {
    ext: ["js"],
    name: "JavaScript",
    icon: <SiJavascript className="text-yellow-400" />,
  },
  {
    ext: ["jsx"],
    name: "React JSX",
    icon: <SiReact className="text-blue-400" />,
  },
  {
    ext: ["ts"],
    name: "TypeScript",
    icon: <SiTypescript className="text-blue-600" />,
  },
  {
    ext: ["tsx"],
    name: "React TSX",
    icon: <SiReact className="text-blue-400" />,
  },
  {
    ext: ["html", "htm"],
    name: "HTML",
    icon: <SiHtml5 className="text-orange-500" />,
  },
  { ext: ["css"], name: "CSS", icon: <SiCss3 className="text-blue-400" /> },
//   { ext: ["scss"], name: "SCSS", icon: <SiSass className="text-pink-500" /> },
//   { ext: ["sass"], name: "Sass", icon: <SiSass className="text-pink-400" /> },
//   { ext: ["less"], name: "Less", icon: <SiLess className="text-blue-600" /> },
  { ext: ["json"], name: "JSON", icon: <SiJson className="text-yellow-400" /> },
//   {
//     ext: ["md"],
//     name: "Markdown",
//     icon: <SiMarkdown className="text-gray-700" />,
//   },
//   { ext: ["svg"], name: "SVG", icon: <SiSvg className="text-purple-600" /> },
//   { ext: ["env"], name: "ENV", icon: <SiDotenv className="text-green-600" /> },
//   {
//     ext: ["yml", "yaml"],
//     name: "YAML",
//     icon: <SiYaml className="text-yellow-600" />,
//   },

  // Backend
  { ext: ["py"], name: "Python", icon: <SiPython className="text-blue-400" /> },
//   { ext: ["java"], name: "Java", icon: <SiJava className="text-orange-700" /> },
//   { ext: ["c"], name: "C", icon: <SiC className="text-blue-500" /> },
  {
    ext: ["cpp", "cc", "cxx"],
    name: "C++",
    icon: <SiCplusplus className="text-blue-700" />,
  },
//   { ext: ["cs"], name: "C#", icon: <SiCsharp className="text-purple-700" /> },
//   { ext: ["go"], name: "Go", icon: <SiGo className="text-blue-400" /> },
//   { ext: ["rb"], name: "Ruby", icon: <SiRuby className="text-red-500" /> },
//   { ext: ["php"], name: "PHP", icon: <SiPhp className="text-indigo-500" /> },
//   { ext: ["rs"], name: "Rust", icon: <SiRust className="text-orange-600" /> },
//   {
//     ext: ["swift"],
//     name: "Swift",
//     icon: <SiSwift className="text-orange-500" />,
//   },
//   {
//     ext: ["kt", "kts"],
//     name: "Kotlin",
//     icon: <SiKotlin className="text-purple-500" />,
//   },
//   { ext: ["dart"], name: "Dart", icon: <SiDart className="text-blue-400" /> },
//   {
//     ext: ["sh", "bash"],
//     name: "Shell",
//     icon: <SiBash className="text-gray-600" />,
//   },
//   {
//     ext: ["bat", "ps1"],
//     name: "Powershell",
//     icon: <SiPowershell className="text-blue-600" />,
//   },
//   { ext: ["lua"], name: "Lua", icon: <SiLua className="text-blue-700" /> },
//   { ext: ["pl"], name: "Perl", icon: <SiPerl className="text-purple-600" /> },
//   { ext: ["r"], name: "R", icon: <SiR className="text-blue-600" /> },
//   { ext: ["scala"], name: "Scala", icon: <SiScala className="text-red-600" /> },
//   {
//     ext: ["hs"],
//     name: "Haskell",
//     icon: <SiHaskell className="text-purple-700" />,
//   },
//   {
//     ext: ["ex", "exs"],
//     name: "Elixir",
//     icon: <SiElixir className="text-purple-600" />,
//   },
//   { ext: ["erl"], name: "Erlang", icon: <SiErlang className="text-red-700" /> },
//   {
//     ext: ["clj", "cljs", "cljc"],
//     name: "Clojure",
//     icon: <SiClojure className="text-green-700" />,
//   },
//   {
//     ext: ["m", "mm"],
//     name: "Objective-C",
//     icon: <SiObjectivec className="text-gray-800" />,
//   },
//   {
//     ext: ["mat"],
//     name: "MATLAB",
//     icon: <SiMatlab className="text-yellow-700" />,
//   },
//   {
//     ext: ["f", "f90", "f95"],
//     name: "Fortran",
//     icon: <SiFortran className="text-blue-800" />,
//   },
//   {
//     ext: ["asm", "s"],
//     name: "Assembly",
//     icon: <SiAssemblyscript className="text-gray-700" />,
//   },

//   // Databases, config, etc.
//   { ext: ["sql"], name: "SQL", icon: <SiMysql className="text-blue-700" /> },
//   {
//     ext: ["psql"],
//     name: "PostgreSQL",
//     icon: <SiPostgresql className="text-blue-800" />,
//   },
//   {
//     ext: ["mongo"],
//     name: "MongoDB",
//     icon: <SiMongodb className="text-green-700" />,
//   },
//   {
//     ext: ["graphql", "gql"],
//     name: "GraphQL",
//     icon: <SiGraphql className="text-pink-500" />,
//   },
//   {
//     ext: ["dockerfile"],
//     name: "Dockerfile",
//     icon: <SiDocker className="text-blue-400" />,
//   },
//   {
//     ext: ["gitignore"],
//     name: "Git Ignore",
//     icon: <SiGit className="text-gray-700" />,
//   },
//   {
//     ext: ["conf", "config", "ini"],
//     name: "Config",
//     icon: <FiFile className="text-gray-600" />,
//   },
//   {
//     ext: ["lock"],
//     name: "Lockfile",
//     icon: <FiFile className="text-gray-600" />,
//   },
];

export function getLanguageData(filename = "") {
  if (!filename)
    return { name: "Plain Text", icon: <FiFile className="text-gray-400" /> };

  const ext = filename.split(".").pop().toLowerCase();
  for (const lang of languageMap) {
    if (lang.ext.includes(ext)) return lang;
  }

  // Special cases
  if (filename === ".env")
    return { name: "ENV", icon: <SiDotenv className="text-green-600" /> };
  if (filename === "Dockerfile")
    return { name: "Dockerfile", icon: <SiDocker className="text-blue-400" /> };
  if (filename === ".gitignore")
    return { name: "Git Ignore", icon: <SiGit className="text-gray-700" /> };

  // Default
  return { name: "Plain Text", icon: <FiFile className="text-gray-400" /> };
}

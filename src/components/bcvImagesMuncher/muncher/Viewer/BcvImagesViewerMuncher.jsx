import { useEffect, useState, useContext } from "react";
import { Box, Stack, IconButton } from "@mui/material";
import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";
import ArrowCircleLeftIcon from "@mui/icons-material/ArrowCircleLeft";
import { getText } from "pankosmia-lib/http";
import { doI18n } from "pankosmia-lib/i18n";
import TextDir from "../helpers/TextDir";
// function ImageViewer({ metadata, reference }) {
//   return (
//     <Stack>
//       <img
//         src={`/api/burrito/ingredient/bytes/${metadata.local_path}?ipath=${reference.slice(2)}.jpg`}
//         alt="resource image"
//       />
//     </Stack>
//   );
// }
function BcvImagesViewerMuncher({ metadata, i18nRef, debugRef, systemBcv }) {
  const [ingredient, setIngredient] = useState([]);
  const [verseNotes, setVerseNotes] = useState([]);
  const [textDir, setTextDir] = useState(
    metadata?.script_direction
      ? metadata.script_direction.toLowerCase()
      : undefined,
  );

  const sbScriptDir = metadata?.script_direction
    ? metadata.script_direction.toLowerCase()
    : undefined;
  const sbScriptDirSet = sbScriptDir === "ltr" || sbScriptDir === "rtl";

  let [current, setCurrent] = useState(0);

  let previousSlide = () => {
    if (current === 0) setCurrent(verseNotes.length - 1);
    else setCurrent(current - 1);
  };

  let nextSlide = () => {
    if (current === verseNotes.length - 1) setCurrent(0);
    else setCurrent(current + 1);
  };

  const getAllData = async () => {
    const ingredientLink = `/api/burrito/ingredient/raw/${metadata.local_path}?ipath=${systemBcv.bookCode}.tsv`;
    let response = await getText(ingredientLink, debugRef.current);
    if (response.ok) {
      setIngredient(
        response.text
          .split("\n")
          .map((l) => l.split("\t").map((f) => f.replace(/\\n/g, "\n\n"))),
      );
    }
  };

  useEffect(
    () => {
      getAllData().then();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [systemBcv],
  );

  useEffect(
    () => {
      const doVerseNotes = async () => {
        let ret = [];
        const start = systemBcv.verseNum;
        const end = systemBcv.endVerseNum || systemBcv.verseNum;
        for (const row of ingredient.filter((l) => {
          const [chapter, verse] = l[0].split(":").map(Number);
          return (
            chapter === systemBcv.chapterNum && verse >= start && verse <= end
          );
        })) {
          ret.push(row[6]);
        }
        setVerseNotes(ret);
        // Reset current index when verseNotes changes
        setCurrent(0);
      };
      doVerseNotes().then();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ingredient, systemBcv],
  );

  const [verseCaptions, setVerseCaptions] = useState([]);

  useEffect(
    () => {
      if (verseNotes.length > 0) {
        const doVerseCaptions = async () => {
          let captions = [];
          for (const v of verseNotes) {
            let response = await getText(
              `/api/burrito/ingredient/raw/${metadata.local_path}?ipath=${v.slice(2)}.txt`,
              debugRef.current,
            );
            if (response.ok) {
              captions = [...captions, response.text];
            } else {
              return "";
            }
          }
          setVerseCaptions(captions);
          if (!sbScriptDirSet) {
            const dir = await TextDir(captions.toString(), "text");
            setTextDir(dir);
          }
        };
        doVerseCaptions().then();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verseNotes],
  );

  const get = async () => {
    const ingredientLink = `/api/burrito/ingredient/raw/${metadata.local_path}?ipath=${systemBcv.bookCode}.tsv`;
    let response = await getText(ingredientLink, debugRef.current);
    if (response.ok) {
      setIngredient(
        response.text
          .split("\n")
          .map((l) => l.split("\t").map((f) => f.replace(/\\n/g, "\n\n"))),
      );
    }
  };

  return (
    <Box
      className="h-full w-full flex flex-col overflow-hidden"
      dir={!sbScriptDirSet ? textDir : undefined}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
          p: 1,
        }}
      >
        {ingredient && verseNotes.length > 0 ? (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Current image */}
            <Box
              component="img"
              src={`/api/burrito/ingredient/bytes/${metadata.local_path}?ipath=${verseNotes[current]?.slice(2)}.jpg`}
              alt="resource image"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />

            {/* Previous button */}
            <IconButton
              aria-label="Previous image"
              onClick={previousSlide}
              sx={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                backgroundColor: "rgba(144, 202, 249, 0.9)",
                color: "white",

                "&:hover": {
                  backgroundColor: "rgba(100, 181, 246, 1)",
                },
              }}
            >
              <ArrowCircleLeftIcon fontSize="large" />
            </IconButton>

            {/* Next button */}
            <IconButton
              aria-label="Next image"
              onClick={nextSlide}
              sx={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                backgroundColor: "rgba(144, 202, 249, 0.9)",
                color: "white",

                "&:hover": {
                  backgroundColor: "rgba(100, 181, 246, 1)",
                },
              }}
            >
              <ArrowCircleRightIcon fontSize="large" />
            </IconButton>

            {/* Image position dots */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                position: "absolute",
                bottom: 70,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 2,
              }}
            >
              {verseNotes.map((v, n) => (
                <Box
                  key={`circle-${n}`}
                  component="button"
                  aria-label={`Go to image ${n + 1}`}
                  onClick={() => setCurrent(n)}
                  sx={{
                    width: 14,
                    height: 14,
                    minWidth: 14,
                    p: 0,
                    border: "1px solid",
                    borderColor: "grey.300",
                    borderRadius: "50%",
                    cursor: "pointer",
                    backgroundColor:
                      n === current ? "primary.light" : "grey.700",
                    boxShadow: 1,

                    "&:hover": {
                      opacity: 0.8,
                    },
                  }}
                />
              ))}
            </Stack>

            {/* Caption */}
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 2,
                textAlign: "center",
                py: 2,
                px: 2,
                fontSize: "1rem",
                fontWeight: 500,
                color: "grey.800",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                boxShadow: 3,
              }}
            >
              {verseCaptions[current] || ""}
              {` (${current + 1} of ${verseNotes.length})`}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              p: 2,
            }}
          >
            {doI18n(
              "munchers:bcv_images_viewer:no_images_found",
              i18nRef.current,
            ) +
              ` (${systemBcv.bookCode} ${systemBcv.chapterNum}:${systemBcv.verseNum}${
                systemBcv.endVerseNum &&
                systemBcv.endVerseNum !== systemBcv.verseNum
                  ? `-${systemBcv.endVerseNum}`
                  : ""
              })`}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default BcvImagesViewerMuncher;

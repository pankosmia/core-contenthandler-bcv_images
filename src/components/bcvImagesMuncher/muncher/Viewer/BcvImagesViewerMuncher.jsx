import { useEffect, useState, useContext } from "react";
import {
  Box,
  Stack,
  Typography,
  MobileStepper,
  Button,
  IconButton,
} from "@mui/material";
import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";
import ArrowCircleLeftIcon from "@mui/icons-material/ArrowCircleLeft";
import { getText } from "pankosmia-lib/http";
import { doI18n } from "pankosmia-lib/i18n";
import TextDir from "../helpers/TextDir";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

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
  const maxSteps = verseNotes?.length || 0;

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

  if (!ingredient || maxSteps === 0) {
    return (
      <Box dir={!sbScriptDirSet ? textDir : undefined}>
        {doI18n("munchers:bcv_images_viewer:no_images_found", i18nRef.current)}
        {` (${systemBcv.bookCode} ${systemBcv.chapterNum}:${systemBcv.verseNum}${
          systemBcv.endVerseNum && systemBcv.endVerseNum !== systemBcv.verseNum
            ? `-${systemBcv.endVerseNum}`
            : ""
        })`}
      </Box>
    );
  }

  // If SB does not specify direction then it is set here, otherwise it has already been set per SB in WorkspaceCard
  return (
    <Box dir={!sbScriptDirSet ? textDir : undefined} sx={{ width: "100%" }}>
      <Box
        component="img"
        src={`/api/burrito/ingredient/bytes/${metadata.local_path}?ipath=${verseNotes[current].slice(2)}.jpg`}
        alt="resource image"
        sx={{ width: "100%", height: 300, objectFit: "contain" }}
      />

      <Typography align="center" sx={{ mt: 1 }}>
        {`${verseCaptions[current]} (${current + 1} of ${verseNotes.length})`}
      </Typography>

      <MobileStepper
        variant="dots"
        steps={maxSteps}
        position="static"
        activeStep={current}
        nextButton={
          <Button
            size="small"
            onClick={nextSlide}
            disabled={current === maxSteps - 1}
          >
            {doI18n(
              "pages:core-contenthandler-bcv_images:next",
              i18nRef.current,
            )}
            <KeyboardArrowRight />
          </Button>
        }
        backButton={
          <Button size="small" onClick={previousSlide} disabled={current === 0}>
            <KeyboardArrowLeft />
            {doI18n(
              "pages:core-contenthandler-bcv_images:previous",
              i18nRef.current,
            )}
          </Button>
        }
      />
    </Box>
  );
}

export default BcvImagesViewerMuncher;

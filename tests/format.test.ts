import { describe, test } from "vitest";
import * as prettier from "prettier";
import path from "path";
import fs from "fs";

const formatFixture = async (name: string) => {
  const prettierConfigFile = fs.readFileSync(
    path.resolve(__dirname, `fixtures/${name}/.prettierrc`),
    "utf8"
  );
  const prettierConfig = JSON.parse(prettierConfigFile);

  const filePath = path.resolve(
    __dirname,
    `fixtures/${name}/example.styles.ts`
  );
  const fileContent = fs.readFileSync(filePath).toString().trim();
  const formatted = await prettier.format(fileContent, {
    ...prettierConfig,
    parser: "typescript"
  });
  return formatted.trim();
};

const getFixtureExpectedOutput = (name: string) => {
  const filePath = path.resolve(
    __dirname,
    `fixtures/${name}/example.styles.formatted.ts`
  );
  return fs.readFileSync(filePath).toString().trim();
};

describe("Parsers", () => {
  test("With prettier config", async ({ expect }) => {
    const fixtureName = "basic";
    expect(await formatFixture(fixtureName)).toEqual(
      getFixtureExpectedOutput(fixtureName)
    );
  });
});

import Head from 'next/head'
import ModelImportTest from "../component/ModelImportTest";
import path from "path";
import fsPromises from 'fs/promises';
import {　ModelDataType, StoringLoadedJsonType　} from "../type";

const Home = (props: StoringLoadedJsonType) => (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" href="/favicon.ico"/>
      </Head>
      <main>
        <h1>Hello Canvas</h1>
        <ModelImportTest modelObj={props}/>
      </main>
    </>
)

export default Home;

const modelData: ModelDataType = {
  'macbook': {
    paintAlias: 'macbook',
    partsCount: 68,
    modelPath: '/model/room/part'
  },
};
export const getServerSideProps = async () =>{
  const { modelPath, partsCount, paintAlias } = modelData['macbook'];
  let modelObj: any = {}
  await loadByParts(modelPath, partsCount, paintAlias);

  async function loadByParts(path: string, count: number, alias: string) {
    for (let i = 1; i <= count; i++) {
      const part = `${path}${i}.json`;
      modelObj[`${path}${i}`] = await JSON.parse(await load(part, alias));
    }
  }
  async function load(filename: string, alias :string, attributes: string | null = null) {
    const filePath = path.join(process.cwd(), filename);
    return await fsPromises.readFile(filePath, 'utf-8')
        .then(res => res.toString())
  }

  return {
    props: modelObj,
  };
};

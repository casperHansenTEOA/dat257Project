import Image from "next/image";

import { dbConnection } from "@/app/backend/dbConnection";


import type { InferGetStaticPropsType, InferGetServerSidePropsType, GetServerSideProps, GetStaticProps } from 'next'

import "./globals.css";
import React from 'react';
import ReactDOM from 'react-dom';

import Dropdown from './frontend/dropdown';
import LnNamn_Dropdown from './frontend/dropdown_ln';
import Resultbox from './frontend/result';
import Dropdown_Ln from "./frontend/dropdown_ln";
import Dropdown_Year from './frontend/dropdown_year';
import Dropdown_Mun from './frontend/dropdown_mun';
import Dropdown_Emission from './frontend/dropdown_emission';

import { Header } from './frontend/header';
import { updateResult } from './frontend/result';
import { Municipality } from "@/app/backend/minicipality";


/*-- Types --*/
type Repo = {
  counties: any[]
  municipalities: { [key: string]: municipalityJSONlist }
}
type municipalityJSONlist = {
  name: string;
  info: [string, string][];
  emissions: {
    [key: number]: number[];
  };
  years: number[];
}[];

/* ---  fetching from the backend --- */
export const getServerSideProps = (async () => {

  // Fetch data from external API
  const db = dbConnection.getInstance()
  const countyNames = await db.getAllCounties() // get all county names
  var counties: any[] = [] // list of counties
  var countyMunicipalityMap = new Map<string, any[]>() // map of county names to list of municipalities
  var municipalitiesJSONformatted: { [key: string]: municipalityJSONlist } = {} // map of municipalities but json


  for (var i = 0; i < countyNames.length; i++) {
    var county = await db.getCounty(countyNames[i])
    counties.push(await county.toJSON())
    var municipalityNames = await county.getMunicipalityNames()
    var municipalitiesPerCounty: municipalityJSONlist = getMunicipalitiesPerCounty();
    countyMunicipalityMap.set(countyNames[i], municipalitiesPerCounty)
  }

  // this makes muicipalities a json serializable object my changing all map entries to arrays
  municipalitiesJSONformatted = Array.from(countyMunicipalityMap.entries()).reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {} as { [key: string]: any[] })


  const repo: Repo = {
    counties: counties,
    municipalities: municipalitiesJSONformatted
  }

  // Pass data to the page via props
  return { props: { repo } }


  /* --- Helper functions --- */
  function getMunicipalitiesPerCounty(): municipalityJSONlist {
    var municipalitiesPerCounty: municipalityJSONlist = [];
    municipalityNames.forEach(async (municipality) => {
      municipalitiesPerCounty.push(((await db.getMunicipality(municipality)).toJSON()));
    });
    return municipalitiesPerCounty;
  }

  
}) satisfies GetServerSideProps<{ repo: Repo }>

/* --- Visuals --- */

export default function Home({
  repo,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {

  return (
    <main>

      <div className="gradient"></div>

      <Header />

      <div className="buttons">

        <Dropdown_Year
          counties={{ repo: repo }} />

        <Dropdown_Ln
          counties={{ counties: repo }} />

        <Dropdown_Mun
          counties={{ counties: repo }} />

        <Dropdown_Emission />

        <a
          className="searchButton"
          target="_blank"
          rel="noopener noreferrer">
          <button onClick={() => clickedSearch(repo)}>
            <h2 className="">
              Search{" "}
              <span className="searchArrow">
                -&gt;
              </span>
            </h2>
          </button>
        </a>
      </div>

      <a className="resultBox">
        <div>
          <Resultbox
            counties={{ counties: repo }} />
        </div>
      </a>
    </main>
  );
}



/* Backend connection */

function clickedSearch(repo: Repo) {
  var query = document.getElementById("result")
  query?.scrollIntoView({ behavior: "smooth" })
  const result_year = document.getElementsByClassName("yearDropdown")[0]
  const result_ln = document.getElementsByClassName("countyDropdown")[0]
  const result_emission = document.getElementsByClassName("emissionDropdown")[0]

  console.log()
  console.log("heehee")
  var year = result_year.value
  var ln = result_ln.value
  var emission = result_emission.value
  if (emission == "NO2") {
    emission = 1
  } else {
    emission = 0
  }

  var year = result_year.value
  var ln = result_ln.value
  var emission = result_emission.value
  if (emission == "NO2") {
    emission = 1
  } else {
    emission = 0
  }
  updateResult(repo, ln, year, emission)
}

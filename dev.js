/*******************************************************************
* Copyright         : 2024 saaawdust
* File Name         : index.js
* Description       : Init for jvavscratch
*                    
* Revision History  :
* Date		Author 		Comments
* ------------------------------------------------------------------
* 13/09/2024	NeuronPulse	Created file, setup environment
*
/******************************************************************/

const { join } = require('path');
const { register } = require('ts-node');

function init(filePath)
{
    register({ project: join(__dirname, "tsconfig.json"), transpileOnly: true, compilerOptions: { ignoreDeprecations: "6.0" } });
    const result = require(filePath);
    return result.default || result;
}

init(join(__dirname, 'src', 'boot.ts'));

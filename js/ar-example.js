// Get the canvas element as a const
const canvas = document.getElementById("renderCanvas");
// Create the BABYON 3D engine, and attach it to the canvas
const engine = new BABYLON.Engine(canvas, true);

// The createScene function
const createScene = async function() {

    // Create a new BABYLON scene, passing in the engine as an argument
    const scene = new BABYLON.Scene(engine);
    

    /* CAMERA
    ---------------------------------------------------------------------------------------------------- */
    // Add a camera and allow it to control the canvas
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0));
    camera.attachControl(canvas, true);


    /* LIGHTING
    ---------------------------------------------------------------------------------------------------- */
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;


    /* GROUND
    ---------------------------------------------------------------------------------------------------- */
    // Note that in AR, we don't need to create a 'ground' mesh, as we are using the real world instead


    /* SKY
    ---------------------------------------------------------------------------------------------------- */
    // We also don't need to build a skybox for AR


    /* MESHES
    ---------------------------------------------------------------------------------------------------- */
    // STEP 1: Create a simple box, and apply a material and a colour to it.
    const box = BABYLON.MeshBuilder.CreateBox("box", {size: 0.5}, scene);
    const boxMat = new BABYLON.StandardMaterial("boxMat", scene);
    boxMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0 );
    box.material = boxMat;

    // STEP 4: Move the box so it is not at your feet
    box.position.x = 1;
    box.position.z = 2;

    // STEP 4b: It is embedded in the floor - bring it up 0.25
    box.position.y= 0.25;



    /* SOUNDS
    ---------------------------------------------------------------------------------------------------- */
    

    /* ANIMATION
    ---------------------------------------------------------------------------------------------------- */


    /* ENABLE AR
    ---------------------------------------------------------------------------------------------------- */
    // STEP 2a: Start a WebXR session (immersive-ar, specifically)
    const xr = await scene.createDefaultXRExperienceAsync({
        uiOptions: {
            sessionMode: "immersive-ar",
            
            // STEP 2b: We need 0, 0, 0 to be a space on the floor, not between your eyes!
            referenceSpaceType: "local-floor"
        },

       // STEP 2c: Meta Quest requires these to be explicitly requested
       optionalFeatures: ["hit-test", "anchors"] 
    });



    /* HIT-TEST
    ---------------------------------------------------------------------------------------------------- */
   
    // STEP 5a: Create the features manager object
    const fm = xr.baseExperience.featuresManager;

    // STEP 5b: Enable the hit-test feature
    const hitTest = fm.enableFeature(BABYLON.WebXRHitTest, "latest");

    // STEP 6a: Create a marker to show where a hit-test has registered a surface
    const marker = BABYLON.MeshBuilder.CreateCylinder("marker", { diameter: 0.15, height: 0.01 }, scene);

    // STEP 6b: Initialize the Quaternion so the hit-test can control rotation in all dimensions
    marker.rotationQuaternion = new BABYLON.Quaternion();

    // STEP 6c: Make the marker invisible by default
    marker.isVisible = false;

    // STEP 6d: Colour the marker
    const markerMat = new BABYLON.StandardMaterial("markerMat", scene);
    markerMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0 );
    markerMat.alpha = 0.5;
    marker.material = markerMat;

    // STEP 7a: Create a variable to store the latest hit-test results
    let lastHitTest;

    // STEP 7b: Add an event listener for the hit-test results
    hitTest.onHitTestResultObservable.add((results) => {

        // STEP 7c: If there is a successful hit-test, then make the marker visible
        if (results.length) {

            marker.isVisible = true;

            // STEP 7d: Grab the hit-test matrix of coordinates
            lastHitTest = results[0];

            // STEP 7e: Extract what we need so that the marker is oriented properly on the detected surface
            lastHitTest.transformationMatrix.decompose(undefined, marker.rotationQuaternion, marker.position);

        } else { 

            // STEP 7f: Otherwise, marker is invisible
            marker.isVisible = false;
        }
    });



    /* ANCHORS
    ---------------------------------------------------------------------------------------------------- */
  
    // STEP 8a: Enable the anchor feature
    const anchorSystem = fm.enableFeature(BABYLON.WebXRAnchorSystem, "latest");

    // STEP 8b: Add event listener for click
    scene.onPointerDown = async () => {

        if(lastHitTest && marker.isVisible) {

            // STEP 8c: Create an anchor point based on the last hit-test coordinates
            const anchor = await anchorSystem.addAnchorPointUsingHitTestResultAsync(lastHitTest);

            // STEP 8d: Build a RANDOM mesh to drop on the surface
            const mesh = buildRandomMesh();

            // STEP 8e: Attach the mesh to the real world!
            anchor.attachedNode = mesh;
        }  
    }
    

    // Function to create a randomly-sized, randomly-coloured mesh
    function buildRandomMesh() {

        // Random size (not too big or too small)
        const randomSize = BABYLON.Scalar.RandomRange(0.05, 0.25);

        // Randomly choose a mesh type
        const meshTypes = ["box", "sphere", "cylinder", "torus"];
        const randomType = meshTypes[Math.floor(Math.random() * meshTypes.length)];

        let mesh;

        switch(randomType) {

           

           
            case "cylinder":
                mesh = BABYLON.MeshBuilder.CreateCylinder("cylinder", { 
                    height: randomSize, 
                    diameter: randomSize 
                }, scene);
                break;

            
        }

        // Move the mesh up so it is not embedded in the surface
        mesh.position.y = randomSize / 2;
        mesh.bakeCurrentTransformIntoVertices();

        // Random colour
        const mat = new BABYLON.StandardMaterial("mat", scene);
        mat.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
        mesh.material = mat;

        return mesh;
    }

    // Return the scene
    return scene;
};


createScene().then((scene) => {

    // Continually render the scene in an endless loop
    engine.runRenderLoop(function () {
        scene.render();
    });

    // Event listener that adapts to the user resizing the screen (in the browser view)
    window.addEventListener("resize", function () {
        engine.resize();
    });
});


// Thanks to the great documentation at https://doc.babylonjs.com/, and some excellent re-factoring of my code by Gemini.
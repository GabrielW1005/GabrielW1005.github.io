import {extensionSections} from './extensions.js?v=20261026-2';
const packet = {
  "title": "Motion & Forces Lab",
  "version": "2.5-extended-experiments",
  "grade": 8,
  "conventions": [
    "Use right/east as positive for horizontal motion and upward as positive for vertical motion, unless stated otherwise.",
    "Use g = 10 m/s² near Earth as a classroom approximation. Use g = 3.7 m/s² on Mars when given.",
    "Write a formula, substitute values, and include units in every quantitative answer.",
    "For conceptual answers, use a complete sentence and evidence from the situation.",
    "Round non-terminating numerical answers to two decimal places unless told otherwise."
  ],
  "sections": [
    {
      "number": 1,
      "title": "Position, distance & displacement",
      "subtitle": "Choose a reference point. Keep track of direction.",
      "sourceNotes": [
        "20.pdf: printed pp. 7–21; distance and displacement p. 19"
      ],
      "warmups": [
        {
          "id": "W1a",
          "prompt": "12 + 5 = ____",
          "answer": "17"
        },
        {
          "id": "W1b",
          "prompt": "9 - (-6) = ____",
          "answer": "15"
        },
        {
          "id": "W1c",
          "prompt": "18 - 18 = ____",
          "answer": "0"
        }
      ],
      "problems": [
        {
          "id": "P01",
          "title": "The hallway delivery",
          "type": "quantitative",
          "prompt": "A student carries a box 12 m east from the classroom to the office, then walks 5 m west to a supply closet. What total distance does the student travel?",
          "answer": "17 m",
          "steps": [
            "Add both lengths: 12 + 5 = 17 m.",
            "Distance counts the entire path, even when direction changes."
          ],
          "simulation": {
            "kind": "route",
            "params": {
              "start": 0,
              "turn": 12,
              "end": 7,
              "speed": 1.2
            },
            "adjustable": [
              {
                "key": "turn",
                "label": "Office position",
                "unit": "m",
                "min": 8,
                "max": 25,
                "step": 1
              },
              {
                "key": "end",
                "label": "Closet position",
                "unit": "m",
                "min": 0,
                "max": 7,
                "step": 1
              }
            ],
            "notes": "East is positive. Walk at 1.2 m/s on both legs; turning time is neglected.",
            "scene": "walkerbox"
          },
          "numericAnswer": {
            "value": 17,
            "unit": "m",
            "quantity": "distance"
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "distance"
          }
        },
        {
          "id": "P02",
          "title": "Across the reference line",
          "type": "quantitative",
          "prompt": "On a straight east–west trail, the water fountain is position 0 m. A walker starts at -6 m and finishes at +9 m. Take east as positive. Find the displacement, including direction.",
          "answer": "+15 m, or 15 m east",
          "steps": [
            "Displacement = final position - initial position.",
            "9 - (-6) = 15 m; positive means east."
          ],
          "simulation": {
            "kind": "route",
            "params": {
              "start": -6,
              "turn": 9,
              "end": 9,
              "speed": 1.5
            },
            "adjustable": [
              {
                "key": "start",
                "label": "Start position",
                "unit": "m",
                "min": -15,
                "max": 0,
                "step": 1
              },
              {
                "key": "end",
                "label": "Finish position",
                "unit": "m",
                "min": 1,
                "max": 20,
                "step": 1
              }
            ],
            "notes": "Single straight trip: keep turn equal to end when end is adjusted. East is positive.",
            "scene": "walker"
          },
          "numericAnswer": {
            "value": 15,
            "unit": "m east",
            "quantity": "displacement"
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "displacement"
          }
        },
        {
          "id": "P03",
          "title": "One complete lap",
          "type": "conceptual",
          "prompt": "A runner completes one full lap of a circular track and stops exactly where she started. Is her distance zero, her displacement zero, both, or neither? Explain using the start and finish.",
          "answer": "The displacement is zero because the start and finish are the same. The distance is not zero because she traveled all the way around the track.",
          "steps": [],
          "simulation": {
            "kind": "circular",
            "params": {
              "radius": 20,
              "speed": 3,
              "laps": 1
            },
            "adjustable": [
              {
                "key": "radius",
                "label": "Track radius",
                "unit": "m",
                "min": 10,
                "max": 40,
                "step": 1
              },
              {
                "key": "speed",
                "label": "Running speed",
                "unit": "m/s",
                "min": 1,
                "max": 5,
                "step": 0.5
              }
            ],
            "notes": "One complete lap; constant speed. Draw the route and the start-to-finish displacement.",
            "scene": "runner"
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        },
        {
          "id": "P04",
          "title": "Seated on the train",
          "type": "conceptual",
          "prompt": "A passenger stays seated while a train moves east at 10 m/s. Describe the passenger’s motion relative to the train, and then relative to the station platform. Why do the descriptions differ?",
          "answer": "The passenger is at rest relative to the train and moves east at 10 m/s relative to the platform. Motion depends on the chosen reference point.",
          "steps": [],
          "simulation": {
            "kind": "uniform",
            "params": {
              "speed": 10,
              "time": 8,
              "frame": 0
            },
            "adjustable": [
              {
                "key": "speed",
                "label": "Train velocity",
                "unit": "m/s",
                "min": 2,
                "max": 20,
                "step": 1
              }
            ],
            "notes": "The passenger remains seated in the train. Platform frame: passenger and train move east together. Train frame: they stay still while the platform moves west. Reference-frame changes do not change the physical trip.",
            "scene": "train"
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        }
      ]
    },
    {
      "number": 2,
      "title": "Speed & velocity",
      "subtitle": "Use a rate, a time, and a direction.",
      "sourceNotes": [
        "22(1).pdf: printed pp. 24–41; math skills p. 32"
      ],
      "warmups": [
        {
          "id": "W2a",
          "prompt": "180 ÷ 120 = ____",
          "answer": "1.5"
        },
        {
          "id": "W2b",
          "prompt": "4 × 45 = ____",
          "answer": "180"
        },
        {
          "id": "W2c",
          "prompt": "Solve: 3t = 90. t = ____",
          "answer": "30"
        }
      ],
      "problems": [
        {
          "id": "P05",
          "title": "Walking the trail",
          "type": "quantitative",
          "prompt": "A student walks 180 m along a straight trail in 120 s. What is the student’s average speed? Include the correct unit.",
          "answer": "1.5 m/s",
          "steps": [
            "Average speed = distance ÷ elapsed time.",
            "180 m ÷ 120 s = 1.5 m/s."
          ],
          "simulation": {
            "kind": "uniform",
            "params": {
              "distance": 180,
              "time": 120
            },
            "adjustable": [
              {
                "key": "distance",
                "label": "Distance",
                "unit": "m",
                "min": 120,
                "max": 200,
                "step": 10
              },
              {
                "key": "time",
                "label": "Elapsed time",
                "unit": "s",
                "min": 100,
                "max": 180,
                "step": 10
              }
            ],
            "notes": "Animation uses constant speed equal to the trip’s average; the measured average does not prove the real walk was perfectly steady.",
            "scene": "walker"
          },
          "numericAnswer": {
            "value": 1.5,
            "unit": "m/s",
            "quantity": "speed"
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "speed"
          }
        },
        {
          "id": "P06",
          "title": "Cycling along the path",
          "type": "quantitative",
          "prompt": "A cyclist rides straight east at a steady 4 m/s for 45 s. How far does the cyclist travel?",
          "answer": "180 m",
          "steps": [
            "Distance = speed × time.",
            "4 m/s × 45 s = 180 m."
          ],
          "simulation": {
            "kind": "uniform",
            "params": {
              "speed": 4,
              "time": 45
            },
            "adjustable": [
              {
                "key": "speed",
                "label": "Speed",
                "unit": "m/s",
                "min": 1,
                "max": 8,
                "step": 0.5
              },
              {
                "key": "time",
                "label": "Elapsed time",
                "unit": "s",
                "min": 10,
                "max": 90,
                "step": 5
              }
            ],
            "notes": "Constant speed on a straight path.",
            "scene": "cyclist"
          },
          "numericAnswer": {
            "value": 180,
            "unit": "m",
            "quantity": "distance"
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "distance"
          }
        },
        {
          "id": "P07",
          "title": "Jogging in opposite directions",
          "type": "conceptual",
          "prompt": "Two joggers pass a fountain. One moves east at 2 m/s; the other moves west at 2 m/s. Do they have the same speed? Do they have the same velocity? Explain.",
          "answer": "They have the same speed, 2 m/s. Their velocities differ because velocity includes direction: east versus west.",
          "steps": [],
          "simulation": {
            "kind": "uniform",
            "params": {
              "speed": 2,
              "otherSpeed": -2,
              "time": 8
            },
            "adjustable": [
              {
                "key": "speed",
                "label": "Eastbound velocity",
                "unit": "m/s",
                "min": 1,
                "max": 4,
                "step": 0.5
              },
              {
                "key": "otherSpeed",
                "label": "Westbound velocity",
                "unit": "m/s",
                "min": -4,
                "max": -1,
                "step": 0.5
              }
            ],
            "notes": "East is positive. Both start at the same reference point and move at constant velocities.",
            "scene": "runner"
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        },
        {
          "id": "P08",
          "title": "The dog stops to sniff",
          "type": "conceptual",
          "prompt": "A dog travels along a path at 2 m/s for 10 s, stops for 10 s, then continues at 2 m/s for 10 s. Is its average speed for all 30 s equal to 2 m/s? Explain why the stop matters.",
          "answer": "No. The dog travels 40 m in 30 s, so the average is about 1.33 m/s. The stop adds time without adding distance.",
          "steps": [],
          "simulation": {
            "kind": "piecewise",
            "params": {
              "times": [
                0,
                10,
                20,
                30
              ],
              "positions": [
                0,
                20,
                20,
                40
              ],
              "distanceScale": 1,
              "timeScale": 1
            },
            "adjustable": [
              {
                "key": "distanceScale",
                "label": "All route distances ×",
                "unit": "",
                "min": 0.5,
                "max": 1.2,
                "step": 0.1
              },
              {
                "key": "timeScale",
                "label": "All time intervals ×",
                "unit": "",
                "min": 1,
                "max": 2,
                "step": 0.25
              }
            ],
            "notes": "Straight path, steady motion within each moving interval, with a 10 s pause. Changes between intervals are idealized as brief.",
            "scene": "dog"
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        }
      ]
    },
    {
      "number": 3,
      "title": "Acceleration",
      "subtitle": "Compare velocities and use elapsed time. Right/east is positive; curved paths change velocity.",
      "sourceNotes": [
        "28.pdf: printed pp. 44–71; acceleration calculation pp. 54, 56–58",
        "Planet-orbit extension: NASA, Chapter 3: Gravity & Mechanics, Acceleration in Orbit; https://science.nasa.gov/learn/basics-of-space-flight/chapter3-3/ (circular-orbit model)."
      ],
      "warmups": [
        {
          "id": "W3a",
          "prompt": "8 - 3 = ____",
          "answer": "5"
        },
        {
          "id": "W3b",
          "prompt": "(14 - 4) ÷ 5 = ____",
          "answer": "2"
        },
        {
          "id": "W3c",
          "prompt": "2 + (0.5 × 4) = ____",
          "answer": "4"
        }
      ],
      "problems": [
        {
          "id": "P09",
          "title": "The bus pulls away",
          "type": "quantitative",
          "prompt": "A bus travels east at 4 m/s when a stopwatch reads 3 s. At 8 s, it travels east at 14 m/s. What is its average acceleration during this interval?",
          "answer": "+2 m/s², east",
          "steps": [
            "Elapsed time = 8 - 3 = 5 s.",
            "Change in velocity = 14 - 4 = 10 m/s.",
            "a = 10 ÷ 5 = 2 m/s² east."
          ],
          "simulation": {
            "kind": "acceleration",
            "params": {
              "vi": 4,
              "vf": 14,
              "time": 5,
              "startTime": 3,
              "endTime": 8
            },
            "adjustable": [
              {
                "key": "vi",
                "label": "Initial velocity",
                "unit": "m/s",
                "min": 2,
                "max": 6,
                "step": 1
              },
              {
                "key": "vf",
                "label": "Final velocity",
                "unit": "m/s",
                "min": 8,
                "max": 14,
                "step": 1
              },
              {
                "key": "startTime",
                "label": "Start reading",
                "unit": "s",
                "min": 1,
                "max": 3,
                "step": 1
              },
              {
                "key": "endTime",
                "label": "End reading",
                "unit": "s",
                "min": 8,
                "max": 12,
                "step": 1
              }
            ],
            "notes": "Uniform acceleration is assumed for the demonstration; the calculation gives average acceleration over the interval.",
            "scene": "bus"
          },
          "numericAnswer": {
            "value": 2,
            "unit": "m/s²",
            "quantity": "acceleration"
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "acceleration"
          }
        },
        {
          "id": "P10",
          "title": "The runner speeds up",
          "type": "quantitative",
          "prompt": "A runner moves east at 2 m/s, then accelerates at 0.5 m/s² for 4 s while continuing east. What is the runner’s final velocity?",
          "answer": "+4 m/s, or 4 m/s east",
          "steps": [
            "Final velocity = initial velocity + acceleration × time.",
            "vf = 2 + (0.5 × 4) = 4 m/s east."
          ],
          "numericAnswer": {
            "value": 4,
            "unit": "m/s",
            "quantity": "finalVelocity"
          },
          "simulation": {
            "kind": "acceleration",
            "scene": "runner",
            "params": {
              "vi": 2,
              "acceleration": 0.5,
              "time": 4
            },
            "adjustable": [
              {
                "key": "vi",
                "label": "Initial velocity",
                "unit": "m/s",
                "min": 0,
                "max": 4,
                "step": 0.5
              },
              {
                "key": "acceleration",
                "label": "Acceleration",
                "unit": "m/s²",
                "min": 0,
                "max": 1,
                "step": 0.1
              },
              {
                "key": "time",
                "label": "Elapsed time",
                "unit": "s",
                "min": 1,
                "max": 6,
                "step": 0.5
              }
            ],
            "notes": "Constant acceleration on a straight eastward path. East is positive."
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "finalVelocity"
          }
        },
        {
          "id": "P11",
          "title": "Backing up faster",
          "type": "conceptual",
          "prompt": "A small remote-control car moves west. Its velocity changes from -1 m/s to -3 m/s in 2 s. Is it speeding up or slowing down? What does the negative sign tell you?",
          "answer": "It is speeding up because its speed rises from 1 to 3 m/s. Negative velocity means west; negative acceleration here also points west and increases the speed.",
          "steps": [],
          "simulation": {
            "kind": "acceleration",
            "params": {
              "vi": -1,
              "vf": -3,
              "time": 2
            },
            "adjustable": [
              {
                "key": "vi",
                "label": "Initial velocity",
                "unit": "m/s",
                "min": -2,
                "max": -0.5,
                "step": 0.5
              },
              {
                "key": "vf",
                "label": "Final velocity",
                "unit": "m/s",
                "min": -5,
                "max": -2.5,
                "step": 0.5
              }
            ],
            "notes": "East is positive. The car continues west throughout the interval, with uniform acceleration.",
            "scene": "car"
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        },
        {
          "id": "P12",
          "title": "Earth in orbit",
          "type": "conceptual",
          "prompt": "Model Earth’s orbit around the Sun as a circle traveled at constant speed. Is Earth accelerating in this model? Explain what changes and what force keeps its path curved.",
          "answer": "Yes. Earth’s velocity changes direction continuously, even at constant speed. The Sun’s gravity provides an inward force and acceleration toward the Sun. The circular orbit is a simplified model.",
          "steps": [],
          "simulation": {
            "kind": "circular",
            "scene": "orbit",
            "params": {
              "radius": 149600000000,
              "orbital": true,
              "laps": 1,
              "orbitAU": 1
            },
            "adjustable": [
              {
                "key": "orbitAU",
                "label": "Orbit radius",
                "unit": "AU",
                "min": 0.6,
                "max": 1.5,
                "step": 0.1
              }
            ],
            "notes": "Simplified circular orbit around the Sun: gravity points inward. Sun’s GM = 1.3271244 × 10²⁰ m³/s²; speed is calculated from √(GM/r). One AU = 149.6 million km. Time is compressed; sizes are not to scale."
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        }
      ]
    },
    {
      "number": 4,
      "title": "Reading motion graphs",
      "subtitle": "Read the axes first. Use a change in value divided by a change in time.",
      "sourceNotes": [
        "22(1).pdf: distance–time graphs pp. 28, 35–36; 28.pdf: speed–time graphs pp. 48, 59"
      ],
      "warmups": [
        {
          "id": "W4a",
          "prompt": "(30 - 0) ÷ (30 - 0) = ____",
          "answer": "1"
        },
        {
          "id": "W4b",
          "prompt": "(8 - 2) ÷ (6 - 0) = ____",
          "answer": "1"
        },
        {
          "id": "W4c",
          "prompt": "Compare: 8/10, 16/10, 4/10. Which is greatest?",
          "answer": "16/10 = 1.6"
        }
      ],
      "problems": [
        {
          "id": "P13",
          "title": "A pause on the nature walk",
          "type": "quantitative",
          "prompt": "The table shows a student’s total distance along a trail. The student walks forward, pauses, then walks forward again. What is the average speed over the entire 30 s, including the pause?",
          "answer": "1.0 m/s",
          "steps": [
            "Use the total distance and the whole elapsed time, including the pause.",
            "30 m ÷ 30 s = 1.0 m/s."
          ],
          "simulation": {
            "kind": "piecewise",
            "params": {
              "times": [
                0,
                10,
                20,
                30
              ],
              "positions": [
                0,
                12,
                12,
                30
              ],
              "distanceScale": 1,
              "timeScale": 1
            },
            "adjustable": [
              {
                "key": "distanceScale",
                "label": "All route distances ×",
                "unit": "",
                "min": 0.5,
                "max": 1.2,
                "step": 0.1
              },
              {
                "key": "timeScale",
                "label": "All time intervals ×",
                "unit": "",
                "min": 1,
                "max": 2,
                "step": 0.25
              }
            ],
            "notes": "Piecewise constant speeds: 1.2 m/s, 0, then 1.8 m/s. The graph is total distance versus time, which matches position here because the student never turns around.",
            "scene": "walker"
          },
          "numericAnswer": {
            "value": 1,
            "unit": "m/s",
            "quantity": "averageSpeed"
          },
          "table": {
            "headers": [
              "Time (s)",
              "Total distance (m)"
            ],
            "rows": [
              [
                0,
                0
              ],
              [
                10,
                12
              ],
              [
                20,
                12
              ],
              [
                30,
                30
              ]
            ]
          },
          "graph": {
            "type": "distance-time",
            "x": [
              0,
              10,
              20,
              30
            ],
            "y": [
              0,
              12,
              12,
              30
            ],
            "xLabel": "Time (s)",
            "yLabel": "Total distance (m)"
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "averageSpeed"
          }
        },
        {
          "id": "P14",
          "title": "Reading a scooter’s speed graph",
          "type": "quantitative",
          "prompt": "The scooter’s speed increases steadily as shown. It travels east throughout. Use two points to find its acceleration from 0 s to 6 s.",
          "answer": "+1 m/s², east",
          "steps": [
            "Change in speed = 8 - 2 = 6 m/s.",
            "Elapsed time = 6 - 0 = 6 s.",
            "a = 6 ÷ 6 = 1 m/s² east."
          ],
          "simulation": {
            "kind": "acceleration",
            "params": {
              "vi": 2,
              "vf": 8,
              "time": 6
            },
            "adjustable": [
              {
                "key": "vi",
                "label": "Initial speed",
                "unit": "m/s",
                "min": 0,
                "max": 4,
                "step": 1
              },
              {
                "key": "vf",
                "label": "Final speed",
                "unit": "m/s",
                "min": 5,
                "max": 10,
                "step": 1
              },
              {
                "key": "time",
                "label": "Elapsed time",
                "unit": "s",
                "min": 3,
                "max": 10,
                "step": 1
              }
            ],
            "notes": "Uniform acceleration in a fixed eastward direction; the straight speed-time graph has constant slope.",
            "scene": "scooter"
          },
          "numericAnswer": {
            "value": 1,
            "unit": "m/s²",
            "quantity": "acceleration"
          },
          "table": {
            "headers": [
              "Time (s)",
              "Speed (m/s)"
            ],
            "rows": [
              [
                0,
                2
              ],
              [
                2,
                4
              ],
              [
                4,
                6
              ],
              [
                6,
                8
              ]
            ]
          },
          "graph": {
            "type": "speed-time",
            "x": [
              0,
              2,
              4,
              6
            ],
            "y": [
              2,
              4,
              6,
              8
            ],
            "xLabel": "Time (s)",
            "yLabel": "Speed (m/s)"
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "acceleration"
          }
        },
        {
          "id": "P15",
          "title": "Which interval is fastest?",
          "type": "conceptual",
          "prompt": "A walker’s distance–time data are shown below. Which 10 s interval has the greatest average speed? Explain how the distances, or the steepness of a graph, support your choice.",
          "answer": "10–20 s is fastest. The walker covers 16 m then, compared with 8 m and 4 m in the other equal time intervals; its graph segment is steepest.",
          "steps": [],
          "simulation": {
            "kind": "piecewise",
            "params": {
              "times": [
                0,
                10,
                20,
                30
              ],
              "positions": [
                0,
                8,
                24,
                28
              ],
              "distanceScale": 1,
              "timeScale": 1
            },
            "adjustable": [
              {
                "key": "distanceScale",
                "label": "All route distances ×",
                "unit": "",
                "min": 0.5,
                "max": 1.2,
                "step": 0.1
              },
              {
                "key": "timeScale",
                "label": "All time intervals ×",
                "unit": "",
                "min": 1,
                "max": 2,
                "step": 0.25
              }
            ],
            "notes": "Forward motion only, with constant speed within each interval. Instant transitions are an idealization.",
            "scene": "walker"
          },
          "table": {
            "headers": [
              "Time (s)",
              "Total distance (m)"
            ],
            "rows": [
              [
                0,
                0
              ],
              [
                10,
                8
              ],
              [
                20,
                24
              ],
              [
                30,
                28
              ]
            ]
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        },
        {
          "id": "P16",
          "title": "What a speed graph cannot tell you",
          "type": "conceptual",
          "prompt": "Two cyclists each ride steadily at 3 m/s for 6 s. One rides east and one rides west. Would their speed–time graphs differ? Could those graphs alone tell you their directions?",
          "answer": "Their speed–time graphs would be identical horizontal lines at 3 m/s. A speed–time graph does not show direction; a velocity–time graph could distinguish them.",
          "steps": [],
          "simulation": {
            "kind": "uniform",
            "params": {
              "speed": 3,
              "otherSpeed": -3,
              "time": 6
            },
            "adjustable": [
              {
                "key": "speed",
                "label": "First velocity",
                "unit": "m/s",
                "min": 1,
                "max": 6,
                "step": 1
              },
              {
                "key": "otherSpeed",
                "label": "Second velocity",
                "unit": "m/s",
                "min": -6,
                "max": -1,
                "step": 1
              }
            ],
            "notes": "At the packet settings their speeds are equal but their velocities have opposite signs.",
            "scene": "cyclist"
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        }
      ]
    },
    {
      "number": 5,
      "title": "Gravity, planets & friction",
      "subtitle": "Mass stays the same from planet to planet. Weight depends on gravity.",
      "sourceNotes": [
        "61.pdf: printed pp. 7–21; weight pp. 11, 18; static friction pp. 11, 19",
        "Mars surface gravity rounded to 3.7 m/s²: NASA Glenn Research Center, Mars; https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/mars/."
      ],
      "warmups": [
        {
          "id": "W5a",
          "prompt": "20 × 3.7 = ____",
          "answer": "74"
        },
        {
          "id": "W5b",
          "prompt": "Solve: f - 35 = 0. f = ____",
          "answer": "35"
        },
        {
          "id": "W5c",
          "prompt": "150 × 3.7 = ____",
          "answer": "555"
        }
      ],
      "problems": [
        {
          "id": "P17",
          "title": "A science instrument on Mars",
          "type": "quantitative",
          "prompt": "A science instrument has a mass of 20 kg. What would its weight be on the surface of Mars? Use Mars’s gravitational acceleration, g = 3.7 m/s².",
          "answer": "74 N downward",
          "steps": [
            "Weight = mass × gravitational acceleration.",
            "W = 20 kg × 3.7 m/s² = 74 N downward."
          ],
          "numericAnswer": {
            "value": 74,
            "unit": "N",
            "quantity": "weight"
          },
          "simulation": {
            "kind": "gravity",
            "scene": "instrument",
            "params": {
              "mass": 20,
              "g": 3.7,
              "supported": true,
              "springK": 500,
              "planet": "Mars"
            },
            "adjustable": [
              {
                "key": "mass",
                "label": "Instrument mass",
                "unit": "kg",
                "min": 5,
                "max": 40,
                "step": 1
              },
              {
                "key": "g",
                "label": "Gravity strength",
                "unit": "N/kg",
                "min": 1.6,
                "max": 10,
                "step": 0.1
              }
            ],
            "notes": "A calibrated spring scale supports the instrument at rest. Weight = mg; the upward scale force balances weight. The same spring stiffness (500 N/m) is used at every setting; larger weight stretches it farther. Mars: 3.7 N/kg; Earth classroom value: 10 N/kg."
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "weight"
          }
        },
        {
          "id": "P18",
          "title": "Keeping the box moving steadily",
          "type": "quantitative",
          "prompt": "A student pushes a plastic equipment box across a smooth floor at a steady speed. The push is 35 N to the right. What is the sliding friction force on the box? Give its size and direction.",
          "answer": "35 N to the left",
          "steps": [
            "Steady velocity means zero acceleration and zero net force.",
            "The friction force must balance the 35 N push: 35 N to the left."
          ],
          "simulation": {
            "kind": "friction",
            "params": {
              "mass": 20,
              "forwardForce": 35,
              "backwardForce": 35,
              "vi": 1,
              "time": 3,
              "steady": true
            },
            "adjustable": [
              {
                "key": "forwardForce",
                "label": "Steady push",
                "unit": "N",
                "min": 15,
                "max": 50,
                "step": 1
              }
            ],
            "notes": "The box slides right at steady velocity. Infer friction as equal in size to the push, opposite in direction. When the push is adjusted, friction is kept equal to preserve the stated steady-motion condition. Vertical forces balance.",
            "scene": "box"
          },
          "numericAnswer": {
            "value": 35,
            "unit": "N",
            "quantity": "frictionForce"
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "frictionForce"
          }
        },
        {
          "id": "P19",
          "title": "The same astronaut on another planet",
          "type": "conceptual",
          "prompt": "An astronaut and suit have a combined mass of 150 kg on Earth. If they were on Mars, where surface gravity is weaker, would their mass change? Would their weight change? Explain.",
          "answer": "Their mass would stay 150 kg because the amount of matter is unchanged. Their weight would be smaller on Mars because the gravitational force would be weaker.",
          "steps": [],
          "simulation": {
            "kind": "gravity",
            "scene": "astronaut",
            "params": {
              "mass": 150,
              "g": 3.7,
              "compareG": 10,
              "supported": true,
              "springK": 5000,
              "planet": "Mars"
            },
            "adjustable": [
              {
                "key": "mass",
                "label": "Astronaut + suit mass",
                "unit": "kg",
                "min": 100,
                "max": 200,
                "step": 5
              },
              {
                "key": "g",
                "label": "Other planet’s gravity",
                "unit": "N/kg",
                "min": 1.6,
                "max": 10,
                "step": 0.1
              }
            ],
            "notes": "Both scales support the same mass at rest. Compare Earth (10 N/kg, rounded) with Mars (3.7 N/kg). Identical spring stiffness (5000 N/m) makes compression proportional to weight. Mass stays the same; scale readings are forces in newtons."
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        },
        {
          "id": "P20",
          "title": "A crate that will not move",
          "type": "conceptual",
          "prompt": "A student pulls a crate right with 10 N, but it stays at rest. Static friction can reach a maximum of 18 N. What is the actual friction force now? Explain why it is not automatically 18 N.",
          "answer": "Static friction is 10 N left, balancing the pull. It adjusts up to its maximum; 18 N is the limit, not the force it always exerts.",
          "steps": [],
          "simulation": {
            "kind": "friction",
            "params": {
              "mass": 20,
              "forwardForce": 10,
              "staticLimit": 18,
              "kineticFriction": 14,
              "vi": 0,
              "time": 3
            },
            "adjustable": [
              {
                "key": "forwardForce",
                "label": "Applied pull",
                "unit": "N",
                "min": 0,
                "max": 30,
                "step": 1
              }
            ],
            "notes": "At rest, static friction matches the pull up to 18 N. Above that threshold the crate slides; model kinetic friction as 14 N opposing motion. Vertical forces balance.",
            "scene": "crate"
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        }
      ]
    },
    {
      "number": 6,
      "title": "Vertical net forces & Newton’s first law",
      "subtitle": "For vertical forces, choose upward as positive. Balanced forces mean zero acceleration.",
      "sourceNotes": [
        "64.pdf: printed pp. 24–39; first law pp. 33–36",
        "Original vertical-force applications use the same signed-force and first-law curriculum relationships."
      ],
      "warmups": [
        {
          "id": "W6a",
          "prompt": "15,000 - 12,000 = ____",
          "answer": "3,000"
        },
        {
          "id": "W6b",
          "prompt": "9,800 + (-10,000) = ____",
          "answer": "-200"
        },
        {
          "id": "W6c",
          "prompt": "12,000 - 12,000 = ____",
          "answer": "0"
        }
      ],
      "problems": [
        {
          "id": "P21",
          "title": "Forces on a helicopter",
          "type": "quantitative",
          "prompt": "A helicopter experiences an upward lifting force of 15,000 N and a downward weight of 12,000 N. Ignore other vertical forces. What is the vertical net force? Include its direction.",
          "answer": "3,000 N upward",
          "steps": [
            "Choose upward as positive.",
            "Fnet = 15,000 - 12,000 = 3,000 N upward."
          ],
          "numericAnswer": {
            "value": 3000,
            "unit": "N",
            "quantity": "netForce"
          },
          "simulation": {
            "kind": "netforce",
            "scene": "helicopter",
            "params": {
              "axis": "vertical",
              "upwardForce": 15000,
              "weight": 12000,
              "g": 10,
              "vi": 0,
              "height": 20,
              "time": 4,
              "ground": true
            },
            "adjustable": [
              {
                "key": "upwardForce",
                "label": "Upward rotor force",
                "unit": "N",
                "min": 8000,
                "max": 20000,
                "step": 500
              },
              {
                "key": "weight",
                "label": "Weight",
                "unit": "N",
                "min": 8000,
                "max": 16000,
                "step": 500
              },
              {
                "key": "vi",
                "label": "Initial vertical velocity",
                "unit": "m/s",
                "min": -3,
                "max": 3,
                "step": 0.5
              }
            ],
            "notes": "Up is positive. Ignore other vertical forces while airborne. The animation infers mass from weight ÷ 10 N/kg and assumes constant forces. Net force sets acceleration, not the direction of existing motion. Ground support is added if it lands."
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "netForce"
          }
        },
        {
          "id": "P22",
          "title": "Forces on a hot-air balloon",
          "type": "quantitative",
          "prompt": "A hot-air balloon has an upward buoyant force of 9,800 N and a total weight of 10,000 N. Ignore air resistance. Take upward as positive. Find the vertical net force, including its sign and direction.",
          "answer": "-200 N, or 200 N downward",
          "steps": [
            "Add the signed vertical forces: Fnet = 9,800 + (-10,000).",
            "Fnet = -200 N; the negative sign means downward."
          ],
          "numericAnswer": {
            "value": -200,
            "unit": "N",
            "quantity": "netForce"
          },
          "simulation": {
            "kind": "netforce",
            "scene": "balloon",
            "params": {
              "axis": "vertical",
              "upwardForce": 9800,
              "weight": 10000,
              "g": 10,
              "vi": 0,
              "height": 40,
              "time": 6,
              "ground": true
            },
            "adjustable": [
              {
                "key": "upwardForce",
                "label": "Upward buoyant force",
                "unit": "N",
                "min": 9000,
                "max": 11000,
                "step": 100
              },
              {
                "key": "weight",
                "label": "Weight",
                "unit": "N",
                "min": 9000,
                "max": 11000,
                "step": 100
              },
              {
                "key": "vi",
                "label": "Initial vertical velocity",
                "unit": "m/s",
                "min": -2,
                "max": 2,
                "step": 0.5
              }
            ],
            "notes": "Up is positive. Ignore air resistance during this short interval. Mass is inferred from weight ÷ 10 N/kg. A downward net force means downward acceleration; a balloon already rising may still rise while slowing."
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "netForce"
          }
        },
        {
          "id": "P23",
          "title": "Balanced forces in flight",
          "type": "conceptual",
          "prompt": "An airplane flies straight and level at constant speed. Upward lift balances its weight, and forward thrust balances drag. Must the airplane stop because the forces balance? Explain what zero net force means.",
          "answer": "No. Zero net force means zero acceleration, so the airplane keeps its current velocity. Balanced forces can act on a moving object; lift balancing weight also means no vertical acceleration.",
          "steps": [],
          "simulation": {
            "kind": "netforce",
            "scene": "airplane",
            "params": {
              "mass": 1200,
              "forwardForce": 3000,
              "backwardForce": 3000,
              "weight": 12000,
              "upwardForce": 12000,
              "vi": 60,
              "time": 5,
              "flight2D": true,
              "g": 10,
              "vy": 0,
              "height": 250
            },
            "adjustable": [
              {
                "key": "vi",
                "label": "Starting forward velocity",
                "unit": "m/s",
                "min": 30,
                "max": 90,
                "step": 5
              },
              {
                "key": "vy",
                "label": "Starting upward velocity",
                "unit": "m/s",
                "min": -5,
                "max": 5,
                "step": 1
              },
              {
                "key": "forwardForce",
                "label": "Thrust (right)",
                "unit": "N",
                "min": 0,
                "max": 6000,
                "step": 500
              },
              {
                "key": "backwardForce",
                "label": "Drag (left)",
                "unit": "N",
                "min": 0,
                "max": 4500,
                "step": 500
              },
              {
                "key": "upwardForce",
                "label": "Lift (up)",
                "unit": "N",
                "min": 6000,
                "max": 18000,
                "step": 500
              },
              {
                "key": "weight",
                "label": "Weight (down)",
                "unit": "N",
                "min": 8000,
                "max": 16000,
                "step": 1000
              }
            ],
            "notes": "A short, simplified flight with constant lift, weight, thrust, and drag. The two force components give horizontal and vertical acceleration through Fnet = ma. Packet values describe level flight at constant velocity. Changed values can produce a climb or descent. Lift is modeled upward and drag leftward over this brief forward-moving flight; changing airspeed does not recalculate aerodynamics, stall, or aircraft rotation. Mass is weight divided by g = 10 N/kg. Starting altitude is 250 m."
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        },
        {
          "id": "P24",
          "title": "After the hockey stick lets go",
          "type": "conceptual",
          "prompt": "A hockey puck glides across very smooth ice after the stick is no longer touching it. Over a short interval, ignore the small friction and air resistance. What happens to its horizontal velocity? Is a continuing forward force required?",
          "answer": "Its horizontal velocity stays constant. A continuing forward force is not needed to maintain motion when the net force is zero; the stick no longer pushes after contact ends.",
          "steps": [],
          "simulation": {
            "kind": "netforce",
            "params": {
              "mass": 0.17,
              "forwardForce": 0,
              "backwardForce": 0,
              "vi": 3,
              "time": 4
            },
            "adjustable": [
              {
                "key": "vi",
                "label": "Initial velocity",
                "unit": "m/s",
                "min": 1,
                "max": 6,
                "step": 0.5
              }
            ],
            "notes": "Idealized short glide: horizontal friction and drag are neglected. Upward ice support balances weight.",
            "scene": "puck"
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        }
      ]
    },
    {
      "number": 7,
      "title": "Newton’s second law",
      "subtitle": "Find the net force first, then divide by the total mass.",
      "sourceNotes": [
        "68 (1).pdf: printed pp. 42–60; F=ma p. 52; circular motion p. 57",
        "Original bird, drone, and model-airplane applications use Fnet = ma; bird forces are averages over takeoff."
      ],
      "warmups": [
        {
          "id": "W7a",
          "prompt": "(6 - 5) ÷ 0.50 = ____",
          "answer": "2"
        },
        {
          "id": "W7b",
          "prompt": "Solve: 1.5m = 3. m = ____",
          "answer": "2"
        },
        {
          "id": "W7c",
          "prompt": "0.8 ÷ 0.4 = ____; 0.8 ÷ 0.8 = ____",
          "answer": "2; 1"
        }
      ],
      "problems": [
        {
          "id": "P25",
          "title": "A bird takes off",
          "type": "quantitative",
          "prompt": "Just after leaving the ground, the air exerts an average upward force of 6 N on a 0.50 kg bird. Its weight is 5 N downward. Ignore other vertical forces. Find the bird’s average vertical acceleration.",
          "answer": "2 m/s² upward",
          "steps": [
            "Find the average net force: 6 - 5 = 1 N upward.",
            "Use a = Fnet ÷ m.",
            "a = 1 N ÷ 0.50 kg = 2 m/s² upward."
          ],
          "numericAnswer": {
            "value": 2,
            "unit": "m/s²",
            "quantity": "acceleration"
          },
          "simulation": {
            "kind": "newton2",
            "scene": "bird",
            "params": {
              "axis": "vertical",
              "mass": 0.5,
              "g": 10,
              "upwardForce": 6,
              "vi": 0,
              "height": 0.1,
              "time": 2,
              "ground": true
            },
            "adjustable": [
              {
                "key": "mass",
                "label": "Bird mass",
                "unit": "kg",
                "min": 0.3,
                "max": 0.8,
                "step": 0.05
              },
              {
                "key": "upwardForce",
                "label": "Average upward air force",
                "unit": "N",
                "min": 3,
                "max": 10,
                "step": 0.5
              }
            ],
            "notes": "Up is positive. Weight is mass × 10 N/kg. During this short interval the wingbeat-averaged upward force is treated as constant; instantaneous wing forces vary. Ground support is added if the bird returns to the ground."
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "acceleration"
          }
        },
        {
          "id": "P26",
          "title": "Finding a drone’s mass",
          "type": "quantitative",
          "prompt": "A drone accelerates upward at 1.5 m/s² when the net upward force on it is 3 N. What is the drone’s total mass, including its battery?",
          "answer": "2 kg",
          "steps": [
            "Start with Fnet = ma and divide by a.",
            "m = 3 N ÷ 1.5 m/s² = 2 kg."
          ],
          "numericAnswer": {
            "value": 2,
            "unit": "kg",
            "quantity": "mass"
          },
          "simulation": {
            "kind": "newton2",
            "scene": "drone",
            "params": {
              "axis": "vertical",
              "netForce": 3,
              "acceleration": 1.5,
              "g": 10,
              "vi": 0,
              "height": 1,
              "time": 3,
              "ground": true
            },
            "adjustable": [
              {
                "key": "netForce",
                "label": "Net upward force",
                "unit": "N",
                "min": 0.5,
                "max": 8,
                "step": 0.5
              },
              {
                "key": "acceleration",
                "label": "Upward acceleration",
                "unit": "m/s²",
                "min": 0.5,
                "max": 4,
                "step": 0.5
              }
            ],
            "notes": "The given force is already NET force. Mass = net force ÷ acceleration. For the force diagram, weight = mg and upward rotor force = weight + net force. These are different from the given net force."
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "mass"
          }
        },
        {
          "id": "P27",
          "title": "Two model airplanes",
          "type": "conceptual",
          "prompt": "Two model airplanes have masses of 0.4 kg and 0.8 kg. The same 0.8 N forward net force acts on each. Which has the greater acceleration? How does doubling the mass affect acceleration when net force stays the same?",
          "answer": "The 0.4 kg airplane has the greater acceleration: 2 m/s² versus 1 m/s². At the same net force, doubling mass halves acceleration.",
          "steps": [],
          "simulation": {
            "kind": "newton2",
            "scene": "modelplanes",
            "params": {
              "mass": 0.4,
              "compareMass": 0.8,
              "netForce": 0.8,
              "vi": 5,
              "time": 3,
              "flight2D": true,
              "g": 10,
              "backwardForce": 0.4,
              "upwardForce": 4,
              "compareLift": 8,
              "vy": 0,
              "height": 100,
              "compareHeight": 120
            },
            "adjustable": [
              {
                "key": "mass",
                "label": "Blue plane mass",
                "unit": "kg",
                "min": 0.2,
                "max": 0.8,
                "step": 0.1
              },
              {
                "key": "compareMass",
                "label": "Orange plane mass",
                "unit": "kg",
                "min": 0.4,
                "max": 1.6,
                "step": 0.1
              },
              {
                "key": "netForce",
                "label": "Same forward net force",
                "unit": "N",
                "min": 0.4,
                "max": 1.6,
                "step": 0.2
              },
              {
                "key": "upwardForce",
                "label": "Blue plane lift (up)",
                "unit": "N",
                "min": 0,
                "max": 12,
                "step": 0.5
              },
              {
                "key": "compareLift",
                "label": "Orange plane lift (up)",
                "unit": "N",
                "min": 0,
                "max": 20,
                "step": 0.5
              },
              {
                "key": "vy",
                "label": "Starting upward velocity",
                "unit": "m/s",
                "min": -2,
                "max": 2,
                "step": 0.5
              }
            ],
            "notes": "Two model airplanes experience the same horizontal net force, with drag 0.4 N and thrust equal to net force plus drag. Each plane has its own lift and weight. Default lift balances weight; changing lift or mass allows vertical motion. For each plane, ax = (thrust − drag)/mass and ay = (lift − weight)/mass. Forces are held constant over this short forward-moving flight; stall and detailed aerodynamics are not modeled. Starting altitudes are 100 m for blue and 120 m for orange."
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        },
        {
          "id": "P28",
          "title": "Force through a bicycle turn",
          "type": "conceptual",
          "prompt": "A cyclist makes a circular turn on level pavement at constant speed. In which direction must the net horizontal force point: forward, outward, or toward the center? Which contact force from the road can provide it?",
          "answer": "The net horizontal force points toward the center. Static friction from the pavement on the tires provides the inward force when the tires roll without skidding.",
          "steps": [],
          "simulation": {
            "kind": "circular",
            "params": {
              "radius": 10,
              "speed": 4,
              "laps": 1,
              "mass": 75
            },
            "adjustable": [
              {
                "key": "radius",
                "label": "Turn radius",
                "unit": "m",
                "min": 8,
                "max": 20,
                "step": 2
              },
              {
                "key": "speed",
                "label": "Speed",
                "unit": "m/s",
                "min": 2,
                "max": 5,
                "step": 0.5
              }
            ],
            "notes": "Constant-speed circular motion without skidding. Horizontal static friction supplies the inward net force; vertical support balances weight.",
            "scene": "cyclist"
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        }
      ]
    },
    {
      "number": 8,
      "title": "Collisions, momentum & Newton’s third law",
      "subtitle": "Momentum can transfer in a collision. A force pair acts on two different objects.",
      "sourceNotes": [
        "72 (1).pdf: printed pp. 63–88; momentum p. 71; force pairs pp. 73–75; conservation p. 76",
        "System momentum is the sum of the objects’ momenta. For the clay-ball collision, total horizontal momentum is unchanged when external horizontal forces are negligible."
      ],
      "warmups": [
        {
          "id": "W8a",
          "prompt": "(6 × 3) + (1.5 × 0) = ____",
          "answer": "18"
        },
        {
          "id": "W8b",
          "prompt": "0.10 × 2 = ____",
          "answer": "0.20"
        },
        {
          "id": "W8c",
          "prompt": "0.20 + 0 = ____",
          "answer": "0.20"
        }
      ],
      "problems": [
        {
          "id": "P29",
          "title": "A bowling ball and a pin",
          "type": "quantitative",
          "prompt": "A 6 kg bowling ball rolls forward at 3 m/s toward a stationary 1.5 kg pin. What is the total momentum of the ball-and-pin system just before impact?",
          "answer": "18 kg·m/s forward",
          "steps": [
            "Find each momentum: ball = 6 × 3 = 18 kg·m/s forward; pin = 1.5 × 0 = 0 kg·m/s.",
            "Add the momenta: total = 18 + 0 = 18 kg·m/s forward."
          ],
          "numericAnswer": {
            "value": 18,
            "unit": "kg·m/s",
            "quantity": "totalMomentum"
          },
          "simulation": {
            "kind": "momentum",
            "scene": "bowling",
            "params": {
              "mass1": 6,
              "mass2": 1.5,
              "velocity1": 3,
              "velocity2": 0,
              "radius1": 0.1085,
              "radius2": 0.06,
              "collisionTime": 1.2,
              "preImpact": true,
              "time": 1.2,
              "bodyLabels": [
                "Ball",
                "Pin"
              ]
            },
            "adjustable": [
              {
                "key": "mass1",
                "label": "Bowling ball mass",
                "unit": "kg",
                "min": 3,
                "max": 7,
                "step": 0.5
              },
              {
                "key": "velocity1",
                "label": "Ball velocity",
                "unit": "m/s",
                "min": 1,
                "max": 5,
                "step": 0.5
              },
              {
                "key": "mass2",
                "label": "Pin mass",
                "unit": "kg",
                "min": 1.3,
                "max": 1.6,
                "step": 0.1
              }
            ],
            "notes": "This model stops just before impact. The pin is part of the system even though its initial momentum is zero. Add both momenta; no post-impact pin motion is assumed."
          },
          "goal": {
            "prompt": "Calculate the requested quantity for the values you set. Restore packet values to solve the printed problem.",
            "quantity": "totalMomentum"
          }
        },
        {
          "id": "P30",
          "title": "Clay balls stick together",
          "type": "quantitative",
          "prompt": "A 0.10 kg clay ball moving right at 2 m/s hits a stationary 0.10 kg clay ball on a smooth, level surface. They stick together. Ignore external horizontal forces during the brief collision. What is the total momentum of the two-ball system before and immediately after the collision?",
          "answer": "0.20 kg·m/s right, both before and immediately after the collision.",
          "steps": [
            "Moving ball: p = 0.10 × 2 = 0.20 kg·m/s right. Stationary ball: p = 0.10 × 0 = 0 kg·m/s.",
            "Total momentum before = 0.20 + 0 = 0.20 kg·m/s right.",
            "Total momentum after = 0.20 kg·m/s right because system momentum is conserved during this brief collision."
          ],
          "numericAnswer": {
            "value": 0.2,
            "unit": "kg·m/s",
            "quantity": "totalMomentum"
          },
          "simulation": {
            "kind": "momentum",
            "scene": "clay",
            "params": {
              "mass1": 0.1,
              "mass2": 0.1,
              "velocity1": 2,
              "velocity2": 0,
              "radius1": 0.023,
              "radius2": 0.023,
              "collisionTime": 1,
              "contactDuration": 0.008,
              "restitution": 0,
              "time": 2,
              "bodyLabels": [
                "Clay 1",
                "Clay 2"
              ]
            },
            "adjustable": [
              {
                "key": "mass1",
                "label": "Blue clay mass",
                "unit": "kg",
                "min": 0.05,
                "max": 0.2,
                "step": 0.05
              },
              {
                "key": "mass2",
                "label": "Orange clay mass",
                "unit": "kg",
                "min": 0.05,
                "max": 0.2,
                "step": 0.05
              },
              {
                "key": "velocity1",
                "label": "Blue clay velocity",
                "unit": "m/s",
                "min": 0.5,
                "max": 3,
                "step": 0.5
              }
            ],
            "notes": "The clay balls deform and stick in a short, perfectly inelastic collision. External horizontal forces are neglected. Total system momentum is conserved; kinetic energy decreases. Use Contact to inspect the brief interaction."
          },
          "goal": {
            "prompt": "Find total system momentum before AND after the collision. It should be the same when external horizontal forces are neglected.",
            "quantity": "totalMomentum"
          }
        },
        {
          "id": "P31",
          "title": "Two marbles collide",
          "type": "conceptual",
          "prompt": "A moving marble hits a stationary marble. During the collision, does the moving marble exert a larger force on the stationary one, or are the forces equal in size? Explain the directions and which object each force acts on.",
          "answer": "The forces are equal in size and opposite in direction. Each marble exerts a force on the other marble. The pair acts on two different objects, so the forces do not cancel when finding the net force on just one marble.",
          "steps": [],
          "simulation": {
            "kind": "momentum",
            "scene": "marbles",
            "params": {
              "mass1": 0.02,
              "mass2": 0.02,
              "velocity1": 0.5,
              "velocity2": 0,
              "radius1": 0.012,
              "radius2": 0.012,
              "collisionTime": 1,
              "contactDuration": 0.001,
              "restitution": 1,
              "time": 2.5,
              "bodyLabels": [
                "Marble 1",
                "Marble 2"
              ]
            },
            "adjustable": [
              {
                "key": "mass1",
                "label": "Blue marble mass",
                "unit": "kg",
                "min": 0.01,
                "max": 0.04,
                "step": 0.005
              },
              {
                "key": "mass2",
                "label": "Orange marble mass",
                "unit": "kg",
                "min": 0.01,
                "max": 0.04,
                "step": 0.005
              },
              {
                "key": "velocity1",
                "label": "Blue marble velocity",
                "unit": "m/s",
                "min": 0.2,
                "max": 1,
                "step": 0.1
              }
            ],
            "notes": "A head-on, ideal elastic collision: a short spring-like compression makes equal and opposite contact forces on the two marbles. Use Contact to freeze that brief instant. Glass deformation is greatly enlarged in the drawing; track friction is ignored."
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        },
        {
          "id": "P32",
          "title": "A curling-stone collision",
          "type": "conceptual",
          "prompt": "A curling stone hits another stone at rest. The first slows down and the second starts moving. Ignore external horizontal forces during the brief collision. Has momentum disappeared? Explain what happens to each stone’s momentum and their combined momentum.",
          "answer": "Momentum is transferred between the stones. Each stone’s momentum changes, but the total momentum of the two-stone system stays the same during the collision because external horizontal forces are neglected.",
          "steps": [],
          "simulation": {
            "kind": "momentum",
            "scene": "curling",
            "params": {
              "mass1": 20,
              "mass2": 20,
              "velocity1": 1,
              "velocity2": 0,
              "radius1": 0.145,
              "radius2": 0.145,
              "collisionTime": 1,
              "contactDuration": 0.01,
              "restitution": 1,
              "time": 3,
              "bodyLabels": [
                "Stone 1",
                "Stone 2"
              ]
            },
            "adjustable": [
              {
                "key": "mass1",
                "label": "Blue stone mass",
                "unit": "kg",
                "min": 17,
                "max": 20,
                "step": 1
              },
              {
                "key": "mass2",
                "label": "Orange stone mass",
                "unit": "kg",
                "min": 17,
                "max": 20,
                "step": 1
              },
              {
                "key": "velocity1",
                "label": "Blue stone velocity",
                "unit": "m/s",
                "min": 0.5,
                "max": 2,
                "step": 0.1
              }
            ],
            "notes": "Head-on collision with external horizontal forces neglected during impact. An ideal elastic collision is used to show momentum transfer; real stones may lose some kinetic energy. Total system momentum stays constant in either case."
          },
          "goal": {
            "prompt": "Use the scene and graph as evidence. The reasoning check uses the original packet situation."
          }
        }
      ]
    }
  ],
  "revisionStatus": {
    "scope": "App synchronized to packet revision 1.2",
    "appUpdateAuthorized": true,
    "pendingAppSync": false,
    "momentumRevision": "Questions 29 and 30 ask total system momentum; no final shared velocity is required."
  }
};

packet.sections.push(...extensionSections);
export default packet;

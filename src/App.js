import { React, useEffect, useState } from 'react';
import './App.scss';
import courseData from './CsRelatedCourses.json';
import Catalog2019 from './2019_Catalog.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid, regular, brands } from '@fortawesome/fontawesome-svg-core/import.macro';
import { FilePicker } from 'react-file-picker';
import Catalogs from './catalogs.json';
import JSONCrush from 'jsoncrush';
import QueryString from 'query-string';
import JSConfetti from 'js-confetti';

import { saveAs } from 'file-saver';

const combineCourses = (semesters) => {
  const courses = [];
  semesters.forEach((semester) => {
    semester.forEach((course) => {
      courses.push(course.ID);
    });
  });

  return courses;
};

const jsConfetti = new JSConfetti();

/**
 * This is a rather long and complex function. You might wanna call it async, or show a loading screen while you run it.
 * @param {[course]} catalog The catalog to validate to.
 */
const validateCourses = async (
  catalog,
  fall1,
  fall2,
  fall3,
  fall4,
  spring1,
  spring2,
  spring3,
  spring4,
  other
) => {
  // Combine the courses.
  const courses = combineCourses([
    fall1,
    fall2,
    fall3,
    fall4,
    spring1,
    spring2,
    spring3,
    spring4,
    other
  ]);

  const electDifferences = [];

  const difference = catalog.requiredCourses.filter((x) => {
    if (x.includes('|')) {
      const orCourse = x.split('|');
      return courses.indexOf(orCourse[0]) === -1 && courses.indexOf(orCourse[1]) === -1;
    } else if (x.includes('*')) {
      const multipleCourse = x.split('*');
      const amount = Number(multipleCourse[1]);
      let count = 0;
      courses.forEach((crs) => {
        if (multipleCourse[0] == crs) {
          count += 1;
        }
      });
      if (count == amount) {
        return false;
      } else {
        electDifferences.push(`${multipleCourse[0]}*${amount - count}`);
        return false;
      }
    }
    return courses.indexOf(x) === -1;
  });

  if (difference.length === 0 && electDifferences.length === 0) {
    return ['valid'];
  } else {
    return ['invalid'].concat(difference).concat(electDifferences);
  }
};

const IDstoCourse = (semester) => {
  const courseList = [];

  semester.forEach((course) => {
    courseList.push(
      courseData.courses.find((c) => {
        return c.ID === course;
      })
    );
  });

  return courseList;
};

const CourseCard = (props) => {
  return (
    <div className="course">
      <div
        className="card-left max c-hand"
        onClick={() => {
          props.onComplete(!props.complete);
        }}>
        <div className="chip">{props.ID}</div>
        <p className={props.complete ? 'text-bold text-primary' : ''}>{props.name}</p>
      </div>
      <div className="card-right">
        <span
          className="tooltip text-center"
          width="16px"
          height="16px"
          data-tooltip={'Course is missing \n pre-reqs'}>
          {props.preReq ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16px"
              viewBox="0 0 512 512"
              fill="#d95555">
              <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM232 152C232 138.8 242.8 128 256 128s24 10.75 24 24v128c0 13.25-10.75 24-24 24S232 293.3 232 280V152zM256 400c-17.36 0-31.44-14.08-31.44-31.44c0-17.36 14.07-31.44 31.44-31.44s31.44 14.08 31.44 31.44C287.4 385.9 273.4 400 256 400z" />
            </svg>
          ) : (
            ''
          )}
        </span>
        <a
          href="#close"
          onClick={() => {
            props.onRemove();
          }}
          className="btn btn-clear float-right"
          aria-label="Close"></a>
      </div>
    </div>
  );
};

/** */
const Courses = (props) => {
  const [activeCourse, setActiveCourse] = useState(null);

  function alphaSort(a, b) {
    const nameA = a.ID.toUpperCase(); // ignore upper and lowercase
    const nameB = b.ID.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }

    // names must be equal
    return 0;
  }

  return props.crs.sort(alphaSort).map((course) => {
    return (
      <div
        key={course.ID}
        className={`course-listing ${activeCourse === course.ID ? 'selected' : ''}`}
        onClick={() => {
          props.onSelectCourse(course);
          setActiveCourse(course.ID);
        }}>
        <div className="mr-1 chip">{course.ID}</div>
        <div className="title">{course.Title}</div>
      </div>
    );
  });
};

const getCatalogIndex = (year) => {
  return 3 - (2022 - year);
};

/**
 * Shows a confirmation dialog
 * @param {{isOpen: boolean, onCancel: ()=>void, onConfirm: ()=>void, title: string, content: string}} props
 * @type {(isOpen: boolean, onCancel: ()=>void, onConfirm: ()=>void, title: string, content: string)=> JSX.Element}
 */
const Confirm = ({ isOpen, onCancel, onConfirm, title, content }) => {
  return (
    <div className={`modal modal-sm ${isOpen ? 'active' : ''}`}>
      <a
        href="#close"
        className="modal-overlay"
        onClick={() => {
          onCancel();
        }}
        aria-label="Close"></a>
      <div className="modal-container">
        <div className="modal-header">
          <a
            href="#"
            aria-label="Close"
            onClick={() => {
              onCancel();
            }}
            className="btn btn-clear float-right"></a>
          <div className="modal-title h5">{title}</div>
        </div>
        <div className="modal-body">
          <div className="content">{content}</div>
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-primary"
            onClick={() => {
              onConfirm();
            }}>
            Confirm
          </button>
          <button
            className="btn btn-link"
            onClick={() => {
              onCancel();
            }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [catalogYear, setCatalogYear] = useState(2019);
  const [showCourses, setShowCourses] = useState(false);
  const [courseSelectSemester, setSelectSemester] = useState('');
  const [semesterID, setSemesterID] = useState('');
  const [selectedCourse, setSelectedCourse] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const showShareModal = () => {
    if (showLink) {
      return (
        <div className="modal active">
          <a
            href="#close"
            className="modal-overlay"
            onClick={() => {
              setShowLink(false);
            }}
            aria-label="Close"></a>
          <div className="modal-container">
            <div className="modal-header">
              <a
                href="#close"
                onClick={() => {
                  setShowLink(false);
                }}
                className="btn btn-clear float-right"
                aria-label="Close"></a>
              <div className="modal-title h5">Share your plan:</div>
            </div>
            <div className="modal-body">
              <div className="content">
                Here is your share link:
                <div>
                  <div className="link">{window.location.toString()}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <a
                href="#"
                onClick={() => {
                  window.navigator.clipboard.writeText(window.location.toString());
                }}
                className="btn btn-primary">
                Copy to Clipboard
              </a>
            </div>
          </div>
        </div>
      );
    } else {
      return <></>;
    }
  };

  const CreateShareString = () => {
    const object = {
      y: catalogYear,
      f1: combineCourses([f1]),
      f2: combineCourses([f2]),
      f3: combineCourses([f3]),
      f4: combineCourses([f4]),
      s1: combineCourses([s1]),
      s2: combineCourses([s2]),
      s3: combineCourses([s3]),
      s4: combineCourses([s4]),
      o: combineCourses([otherSemester])
    };

    const rawJSON = JSON.stringify(object);
    const crushedJSON = JSONCrush.crush(rawJSON);
    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('d', crushedJSON);
    window.history.pushState({}, document.title, '/?' + urlParams);
  };

  const ParseShareString = () => {
    const parse = QueryString.parse(window.location.search);

    const uncrush = JSONCrush.uncrush(parse.d);
    const decode = JSON.parse(uncrush);
    return decode;
  };

  useEffect(() => {
    if (QueryString.parse(window.location.search).d !== undefined) {
      const data = ParseShareString();
      setCatalogYear(data.y);
      setF1(IDstoCourse(data.f1));
      setF2(IDstoCourse(data.f2));
      setF3(IDstoCourse(data.f3));
      setF4(IDstoCourse(data.f4));
      setS1(IDstoCourse(data.s1));
      setS2(IDstoCourse(data.s2));
      setS3(IDstoCourse(data.s3));
      setS4(IDstoCourse(data.s4));
      setOtherSemester(IDstoCourse(data.o));
    }
  }, []);

  const showAddCourse = (courseName) => {
    setErrorText(`"${courseName}" has already been added to this semester.`);
    setShowError(!showError);
  };

  // TODO: Have better checks for duplicate courses.
  const addCourse = (id, course) => {
    if (id == 'fall1') {
      if (f1.some((crs) => crs.ID === course.ID) && !course.isElective) {
        showAddCourse(course.Title);
      } else {
        setF1([...f1, course]);
      }
    } else if (id === 'spring1') {
      if (s1.some((crs) => crs.ID === course.ID) && !course.isElective) {
        showAddCourse(course.Title);
      } else {
        setS1([...s1, course]);
      }
    } else if (id == 'fall2') {
      if (f2.some((crs) => crs.ID === course.ID) && !course.isElective) {
        showAddCourse(course.Title);
      } else {
        setF2([...f2, course]);
      }
    } else if (id === 'spring2') {
      if (s2.some((crs) => crs.ID === course.ID) && !course.isElective) {
        showAddCourse(course.Title);
      } else {
        setS2([...s2, course]);
      }
    } else if (id == 'fall3') {
      if (f3.some((crs) => crs.ID === course.ID) && !course.isElective) {
        showAddCourse(course.Title);
      } else {
        setF3([...f3, course]);
      }
    } else if (id === 'spring3') {
      if (s3.some((crs) => crs.ID === course.ID) && !course.isElective) {
        showAddCourse(course.Title);
      } else {
        setS3([...s3, course]);
      }
    } else if (id == 'fall4') {
      if (f4.some((crs) => crs.ID === course.ID) && !course.isElective) {
        showAddCourse(course.Title);
      } else {
        setF4([...f4, course]);
      }
    } else if (id === 'spring4') {
      if (s4.some((crs) => crs.ID === course.ID) && !course.isElective) {
        showAddCourse(course.Title);
      } else {
        setS4([...s4, course]);
      }
    } else if (id === 'spring4') {
      if (s4.some((crs) => crs.ID === course.ID) && !course.isElective) {
        showAddCourse(course.Title);
      } else {
        setS4([...s4, course]);
      }
    } else if (id === 'other') {
      if (otherSemester.some((crs) => crs.ID === course.ID) && !course.isElective) {
        showAddCourse(course.Title);
      } else {
        setOtherSemester([...otherSemester, course]);
      }
    }
  };

  const [catalog, setCatalog] = useState(Catalogs.data[`${catalogYear}`].recommendedCourses);
  const [f1, setF1] = useState(catalog.f1);
  const [s1, setS1] = useState(catalog.s1);
  const [f2, setF2] = useState(catalog.f2);
  const [s2, setS2] = useState(catalog.s2);
  const [f3, setF3] = useState(catalog.f3);
  const [s3, setS3] = useState(catalog.s3);
  const [f4, setF4] = useState(catalog.f4);
  const [s4, setS4] = useState(catalog.s4);
  const [otherSemester, setOtherSemester] = useState([]);

  const removeCourse = (id, index) => {
    if (id === 'fall1') {
      setF1((existing) => {
        return [...existing.slice(0, index), ...existing.slice(index + 1)];
      });
    } else if (id === 'spring1') {
      setS1((existing) => {
        return [...existing.slice(0, index), ...existing.slice(index + 1)];
      });
    } else if (id === 'fall2') {
      setF2((existing) => {
        return [...existing.slice(0, index), ...existing.slice(index + 1)];
      });
    } else if (id === 'spring2') {
      setS2((existing) => {
        return [...existing.slice(0, index), ...existing.slice(index + 1)];
      });
    } else if (id === 'fall3') {
      setF3((existing) => {
        return [...existing.slice(0, index), ...existing.slice(index + 1)];
      });
    } else if (id === 'spring3') {
      setS3((existing) => {
        return [...existing.slice(0, index), ...existing.slice(index + 1)];
      });
    } else if (id === 'fall4') {
      setF4((existing) => {
        return [...existing.slice(0, index), ...existing.slice(index + 1)];
      });
    } else if (id == 'spring4') {
      setS4((existing) => {
        return [...existing.slice(0, index), ...existing.slice(index + 1)];
      });
    } else if (id == 'other') {
      setOtherSemester((existing) => {
        return [...existing.slice(0, index), ...existing.slice(index + 1)];
      });
    }
  };

  const setCourse = (id, index, value) => {
    if (id === 'fall1') {
      const oldItem = Object.assign({}, f1[index]);
      oldItem.completed = value;
      setF1((existing) => {
        return [...existing.slice(0, index), oldItem, ...existing.slice(index + 1)];
      });
    } else if (id === 'spring1') {
      const oldItem = Object.assign({}, s1[index]);
      oldItem.completed = value;
      setS1((existing) => {
        return [...existing.slice(0, index), oldItem, ...existing.slice(index + 1)];
      });
    } else if (id === 'fall2') {
      const oldItem = Object.assign({}, f2[index]);
      oldItem.completed = value;
      setF2((existing) => {
        return [...existing.slice(0, index), oldItem, ...existing.slice(index + 1)];
      });
    } else if (id === 'spring2') {
      const oldItem = Object.assign({}, s2[index]);
      oldItem.completed = value;
      setS2((existing) => {
        return [...existing.slice(0, index), oldItem, ...existing.slice(index + 1)];
      });
    } else if (id === 'fall3') {
      const oldItem = Object.assign({}, f3[index]);
      oldItem.completed = value;
      setF3((existing) => {
        return [...existing.slice(0, index), oldItem, ...existing.slice(index + 1)];
      });
    } else if (id === 'spring3') {
      const oldItem = Object.assign({}, s3[index]);
      oldItem.completed = value;
      setS3((existing) => {
        return [...existing.slice(0, index), oldItem, ...existing.slice(index + 1)];
      });
    } else if (id === 'fall4') {
      const oldItem = Object.assign({}, f4[index]);
      oldItem.completed = value;
      setF4((existing) => {
        return [...existing.slice(0, index), oldItem, ...existing.slice(index + 1)];
      });
    } else if (id == 'spring4') {
      const oldItem = Object.assign({}, s4[index]);
      oldItem.completed = value;
      setS4((existing) => {
        return [...existing.slice(0, index), oldItem, ...existing.slice(index + 1)];
      });
    } else if (id == 'other') {
      const oldItem = Object.assign({}, otherSemester[index]);
      oldItem.completed = value;
      setOtherSemester((existing) => {
        return [...existing.slice(0, index), oldItem, ...existing.slice(index + 1)];
      });
    }
  };

  const generateItems = (courses, id) => {
    let count = 0;
    if (courses.length > 0) {
      return courses.map((course, index) => {
        if (course.isElective) {
          count += 1;
          return (
            <CourseCard
              key={`${course.ID}-${count}`}
              name={course.Title}
              ID={course.ID}
              onRemove={() => {
                removeCourse(id, index);
              }}
              complete={course.completed}
              onComplete={(v) => {
                setCourse(id, index, v);
              }}
            />
          );
        }
        return (
          <CourseCard
            key={course.ID}
            name={course.Title}
            ID={course.ID}
            onRemove={() => {
              removeCourse(id, index);
            }}
            complete={course.completed}
            onComplete={(v) => {
              setCourse(id, index, v);
            }}
          />
        );
      });
    } else {
      return (
        <div className="empty">
          <div className="empty-title h5">No Courses Added</div>
        </div>
      );
    }
  };

  const semesterHours = (courses) => {
    let hours = 0;
    courses.forEach((course) => {
      hours += course.Hours;
    });
    return hours;
  };

  const [loadingValidation, setLoadingValidation] = useState(true);
  const [validationResults, setValidationResults] = useState([]);
  const [showError, setShowError] = useState(false);
  const [errorText, setErrorText] = useState('null');

  // TODO: Change validation to be more indepth;
  const validateResults = async () => {
    setLoadingValidation(true);
    const result = await validateCourses(
      Catalogs.data[`${catalogYear}`],
      f1,
      f2,
      f3,
      f4,
      s1,
      s2,
      s3,
      s4,
      otherSemester
    );
    if (result[0] === 'valid') {
      setValidationResults([]);
      jsConfetti
        .addConfetti({ confettiColors: ['red', '#d95555', 'black', '#cd2e2e'] })
        .then(() => {
          console.log('Confetti Done');
        });
      setLoadingValidation(false);
    } else {
      result.shift();
      setValidationResults(result);
      setLoadingValidation(false);
    }
  };

  const [showFullLoading, setFullLoading] = useState(false);

  const loadPlanFromFile = (file) => {
    setFullLoading(true);
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onloadend = (event) => {
      const loadedJson = JSON.parse(event.target.result);
      setF1(loadedJson.courses.fallOne);
      setF2(loadedJson.courses.fallTwo);
      setF3(loadedJson.courses.fallThree);
      setF4(loadedJson.courses.fallFour);
      setS1(loadedJson.courses.springOne);
      setS2(loadedJson.courses.springTwo);
      setS3(loadedJson.courses.springThree);
      setS4(loadedJson.courses.springFour);
      setOtherSemester(loadedJson.courses.other);
      setCatalogYear(loadedJson.catalogYear);
      setFullLoading(false);
    };
  };

  const downloadPlan = () => {
    const object = {
      catalogYear: `${catalogYear}`,
      courses: {
        fallOne: f1,
        springOne: s1,
        fallTwo: f2,
        springTwo: s2,
        fallThree: f3,
        springThree: s3,
        fallFour: f4,
        springFour: s4,
        other: otherSemester
      }
    };

    const blob = new Blob([JSON.stringify(object)], { type: 'text/json' });
    saveAs(blob, 'CS_Degree_Plan.csplan');
  };

  const loadResult = () => {
    if (loadingValidation) {
      return <div className="loading"></div>;
    } else {
      if (validationResults.length > 0) {
        return (
          <div>
            <h6>You are missing the following courses:</h6>
            {validationResults.map((result) => {
              if (result.includes('*')) {
                const str = result.split('*');
                const amount = str[1];
                const courseIndex = courseData.courses.findIndex((x) => x.ID === str[0]);
                const course = courseData.courses[courseIndex];
                if (courseIndex !== -1) {
                  return (
                    <div className="div-list">
                      <div className="chip mr-2">{course.ID}</div>
                      {amount} of {course.Title}
                    </div>
                  );
                }
              }
              const courseIndex = courseData.courses.findIndex((x) => x.ID === result);
              const course = courseData.courses[courseIndex];
              if (courseIndex !== -1) {
                return (
                  <div className="div-list">
                    <div className="chip mr-2">{course.ID}</div>
                    {course.Title}
                  </div>
                );
              } else {
                console.log(result);
              }
            })}
          </div>
        );
      } else {
        return (
          <div>
            <h5 className="text-primary">Degree Plan Validated!</h5>
            <div>Your degree plan is valid for the {catalogYear} catalog.</div>
          </div>
        );
      }
    }
  };

  const isLoading = () => {
    if (showFullLoading) {
      return (
        <div className="modal active">
          <a href="#close" className="modal-overlay" aria-label="Close"></a>
          <div className="modal-body">
            <div className="content">
              <div className="loading loading-lg"></div>
            </div>
          </div>
        </div>
      );
    } else {
      return <></>;
    }
  };

  const [tempCatalog, setTempCatalog] = useState(2019);
  const [showCatalogConfirm, setCatalogConfirm] = useState(false);

  const changeCatalogYear = () => {
    setCatalogYear(tempCatalog);
    const Catalog = Catalogs.data[`${tempCatalog}`].recommendedCourses;
    setCatalog(Catalog);
    setF1(Catalog.f1);
    setF2(Catalog.f2);
    setF3(Catalog.f3);
    setF4(Catalog.f4);
    setS1(Catalog.s1);
    setS2(Catalog.s2);
    setS3(Catalog.s3);
    setS4(Catalog.s4);
    setOtherSemester([]);
    window.history.pushState({}, document.title, '/');
    setCatalogConfirm(!showAddCourse);
  };

  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="App">
      <div className="container my-2">
        <div className="columns">
          <div className="title-header flex-column-md">
            <div className="main-title">
              <span className="text-tiny text-primary ttu">
                Texas Tech University
                <br />
              </span>
              Computer Science <span className="avoid-wrap">Degree Plan</span>
            </div>
            <div className="option-buttons hide-sm">
              <div className="f-row">
                <button className="btn btn-primary btn-act" onClick={downloadPlan}>
                  <FontAwesomeIcon className="menu-icon hide-md" icon={solid('download')} />
                  Save Plan
                </button>
              </div>

              <div className="f-row">
                <div className="btn-act">
                  <FilePicker
                    extensions={['csplan']}
                    onError={() => {
                      window.alert('Could not upload');
                    }}
                    onChange={(file) => {
                      loadPlanFromFile(file);
                    }}>
                    <button className="btn btn-primary">
                      <FontAwesomeIcon className="menu-icon hide-md" icon={solid('file-import')} />
                      Load Plan
                    </button>
                  </FilePicker>
                </div>
              </div>
              <div className="f-row">
                <button
                  className="btn btn-primary btn-act"
                  onClick={() => {
                    CreateShareString();
                    setShowLink(true);
                  }}>
                  <FontAwesomeIcon
                    className="menu-icon hide-md"
                    icon={solid('share-from-square')}
                  />
                  Plan Link
                </button>
              </div>
              <div className="f-row">
                <button
                  className="btn btn-primary btn-act"
                  onClick={() => {
                    setShowValidation(!showValidation);
                    validateResults();
                  }}>
                  <FontAwesomeIcon className="menu-icon hide-md" icon={solid('list-check')} />
                  Validate Plan
                </button>
              </div>
            </div>
          </div>
        </div>

        <Confirm
          isOpen={showCatalogConfirm}
          onCancel={() => {
            setCatalogConfirm(!showCatalogConfirm);
          }}
          onConfirm={() => {
            changeCatalogYear();
          }}
          title={'Confirm Catalog Change?'}
          content={
            'This will remove all edits made to your plan, and reset all semesters to default.'
          }
        />

        <div className="columns jc-center  hide-print">
          <div className="column f-column-sm show-sm ">
            <div className="dropdown">
              <a href="#" className="btn btn-primary btn-full dropdown-toggle" tabIndex="0">
                Actions{' '}
                <span className="button-icon">
                  <FontAwesomeIcon icon={solid('angle-down')} />
                </span>
              </a>
              <ul className="menu btn-full">
                <li className="menu-item">
                  <a href="#" onClick={downloadPlan}>
                    <FontAwesomeIcon className="menu-icon" icon={solid('download')} />
                    Save Plan
                  </a>
                </li>
                <li className="menu-item">
                  <FilePicker
                    extensions={['csplan']}
                    onError={() => {
                      window.alert('Could not upload');
                    }}
                    onChange={(file) => {
                      loadPlanFromFile(file);
                    }}>
                    <a href="#">
                      <FontAwesomeIcon className="menu-icon" icon={solid('file-import')} />
                      Load Plan
                    </a>
                  </FilePicker>
                </li>
                <li className="menu-item">
                  <a
                    href="#"
                    onClick={() => {
                      CreateShareString();
                      setShowLink(true);
                    }}>
                    <FontAwesomeIcon className="menu-icon" icon={solid('share-from-square')} />
                    Share Plan
                  </a>
                </li>
                <li className="menu-item">
                  <a
                    onClick={() => {
                      setShowValidation(!showValidation);
                      validateResults();
                    }}
                    href="#">
                    <FontAwesomeIcon className="menu-icon" icon={solid('list-check')} />
                    Validate Plan
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="dropdown catalog-year center-md ">
            <a href="#" className="btn dropdown-toggle sm-dropdown btn-drop" tabIndex="0">
              Catalog Year: {catalogYear}{' '}
              <span className="button-icon px-2">
                <FontAwesomeIcon icon={solid('angle-down')} />
              </span>
            </a>
            <ul className="menu sm-dropdown">
              <li className="menu-item">
                <a
                  onClick={() => {
                    setTempCatalog(2019);
                    setCatalogConfirm(true);
                  }}
                  href="#">
                  2019-2020
                </a>
              </li>
              <li className="menu-item">
                <a
                  onClick={() => {
                    setTempCatalog(2020);
                    setCatalogConfirm(true);
                  }}
                  href="#">
                  2020 Onward
                </a>
              </li>
            </ul>
          </div>
        </div>
        {showShareModal()}
        <div className="columns mt-p5">
          <div className="column col-lg-12">
            <div className="course-header">
              <h5 className="mr-title">
                1st Year - Fall
                <br />
                <span className="text-small text-primary"> {semesterHours(f1)} hours</span>
              </h5>
              <button
                className="btn add-course"
                onClick={() => {
                  setSelectSemester('Fall 1st Year');
                  setSemesterID('fall1');
                  setShowCourses(!showCourses);
                }}>
                Add Courses
              </button>
            </div>

            {generateItems(f1, 'fall1')}
          </div>
          <div className="divider-vert text-center hide-lg" data-content="YEAR 1"></div>
          <div className="column col-lg-12">
            <div className="course-header">
              <h5 className="mr-title">
                1st Year - Spring
                <br />
                <span className="text-small text-primary">{semesterHours(s1)} hours</span>
              </h5>
              <button
                className="btn add-course"
                onClick={() => {
                  setSelectSemester('Spring 1st Year');
                  setSemesterID('spring1');
                  setShowCourses(!showCourses);
                }}>
                Add Courses
              </button>
            </div>

            {generateItems(s1, 'spring1')}
          </div>
        </div>
        <div className="columns mt-p5">
          <div className="column col-lg-12">
            <div className="course-header">
              <h5 className="mr-title">
                2nd Year - Fall
                <br />
                <span className="text-small text-primary">{semesterHours(f2)} hours</span>
              </h5>
              <button
                className="btn add-course"
                onClick={() => {
                  setSelectSemester('Fall 2nd Year');
                  setSemesterID('fall2');
                  setShowCourses(!showCourses);
                }}>
                Add Courses
              </button>
            </div>

            {generateItems(f2, 'fall2')}
          </div>
          <div className="divider-vert text-center hide-lg" data-content="YEAR 2"></div>
          <div className="column col-lg-12">
            <div className="course-header">
              <h5 className="mr-title">
                2nd Year - Spring
                <br />
                <span className="text-small text-primary">{semesterHours(s2)} hours</span>
              </h5>
              <button
                className="btn add-course"
                onClick={() => {
                  setSelectSemester('Spring 2nd Year');
                  setSemesterID('spring2');
                  setShowCourses(!showCourses);
                }}>
                Add Courses
              </button>
            </div>

            {generateItems(s2, 'spring2')}
          </div>
        </div>
        <div className="columns mt-p5">
          <div className="column col-lg-12">
            <div className="course-header">
              <h5 className="mr-title">
                3rd Year - Fall
                <br />
                <span className="text-small text-primary">{semesterHours(f3)} hours</span>
              </h5>
              <button
                className="btn add-course"
                onClick={() => {
                  setSelectSemester('Fall 3rd Year');
                  setSemesterID('fall3');
                  setShowCourses(!showCourses);
                }}>
                Add Courses
              </button>
            </div>

            {generateItems(f3, 'fall3')}
          </div>
          <div className="divider-vert text-center hide-lg" data-content="YEAR 3"></div>
          <div className="column col-md-12">
            <div className="course-header">
              <h5 className="mr-title">
                3rd Year - Spring
                <br />
                <span className="text-small text-primary">{semesterHours(s3)} hours</span>
              </h5>
              <button
                className="btn add-course"
                onClick={() => {
                  setSelectSemester('Spring 3rd Year');
                  setSemesterID('spring3');
                  setShowCourses(!showCourses);
                }}>
                Add Courses
              </button>
            </div>

            {generateItems(s3, 'spring3')}
          </div>
        </div>
        <div className="columns mt-p5">
          <div className="column col-md-12">
            <div className="course-header">
              <h5 className="mr-title">
                4th Year - Fall
                <br />
                <span className="text-small text-primary">{semesterHours(f4)} hours</span>
              </h5>
              <button
                className="btn add-course"
                onClick={() => {
                  setSelectSemester('Fall 4th Year');
                  setSemesterID('fall4');
                  setShowCourses(!showCourses);
                }}>
                Add Courses
              </button>
            </div>

            {generateItems(f4, 'fall4')}
          </div>
          <div className="divider-vert text-center hide-lg" data-content="YEAR 4"></div>
          <div className="column col-md-12">
            <div className="course-header">
              <h5 className="mr-title">
                4th Year - Spring
                <br />
                <span className="text-small text-primary">{semesterHours(s4)} hours</span>
              </h5>
              <button
                className="btn add-course"
                onClick={() => {
                  setSelectSemester('Spring 4th Year');
                  setSemesterID('spring4');
                  setShowCourses(!showCourses);
                }}>
                Add Courses
              </button>
            </div>

            {generateItems(s4, 'spring4')}
          </div>
        </div>
        <div className="columns mt-p5">
          <div className="column">
            <div className="course-header">
              <h5 className="mr-title">
                Transfer/Summer
                <br />
                <span className="text-small text-primary">
                  {semesterHours(otherSemester)} hours
                </span>
              </h5>
              <button
                className="btn add-course"
                onClick={() => {
                  setSelectSemester('Transfer/Summer');
                  setSemesterID('other');
                  setShowCourses(!showCourses);
                }}>
                Add Courses
              </button>
            </div>

            {generateItems(otherSemester, 'other')}
          </div>
        </div>
      </div>

      {isLoading()}
      <div className={`modal ${showValidation ? 'active' : ''}`} id="modal-id">
        <a
          href="#close"
          className="modal-overlay"
          onClick={() => {
            setShowValidation(!showValidation);
          }}
          aria-label="Close"></a>
        <div className="modal-container">
          <div className="modal-header">
            <a
              href="#close"
              onClick={() => {
                setShowValidation(!showValidation);
              }}
              className="btn btn-clear float-right"
              aria-label="Close"></a>
            <div className="modal-title h5">Validation Results</div>
          </div>
          <div className="modal-body">
            <div className="content">{loadResult()}</div>
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-link"
              onClick={() => {
                setShowValidation(!showValidation);
              }}>
              Close
            </button>
          </div>
        </div>
      </div>
      <div className={`modal ${showCourses ? 'active' : ''}`} id="modal-id">
        <a
          href="#close"
          className="modal-overlay"
          onClick={() => {
            setShowCourses(!showCourses);
          }}
          aria-label="Close"></a>
        <div className="modal-container">
          <div className="modal-header">
            <a
              href="#close"
              onClick={() => {
                setShowCourses(!showCourses);
              }}
              className="btn btn-clear float-right"
              aria-label="Close"></a>
            <div className="modal-title h5">Add Course to {courseSelectSemester}</div>
          </div>
          <input
            className="form-input p-16"
            type="text"
            id="input-example-1"
            placeholder="Course Name"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
            }}
          />
          <div className="modal-body">
            <div className="content min-height">
              <Courses
                crs={courseData.courses.filter((crs) => {
                  if (searchValue !== '') {
                    return (
                      crs.Title.toLowerCase().includes(searchValue.toLowerCase()) ||
                      crs.ID.toLowerCase().includes(searchValue.toLowerCase())
                    );
                  } else {
                    return true;
                  }
                })}
                onSelectCourse={(c) => {
                  setSelectedCourse(c);
                }}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-primary"
              onClick={() => {
                const course = selectedCourse;
                if (selectedCourse.ID != undefined) {
                  addCourse(semesterID, course);
                  setShowCourses(!showCourses);
                }
              }}>
              Add Course
            </button>
          </div>
        </div>
      </div>
      <div className={`modal modal-sm ${showError ? 'active' : ''}`}>
        <a
          href="#close"
          className="modal-overlay"
          onClick={() => {
            setShowError(!showError);
          }}
          aria-label="Close"></a>
        <div className="modal-container">
          <div className="modal-header">
            <a
              href="#close"
              onClick={() => {
                setShowError(!showError);
              }}
              className="btn btn-clear float-right"
              aria-label="Close"></a>
            <div className="modal-title h5">Something went wrong! </div>
          </div>
          <div className="modal-body">
            <div>{errorText}</div>
          </div>
          <div className="modal-footer">
            <button
              className="btn"
              onClick={() => {
                setShowError(!showError);
              }}>
              Ok
            </button>
          </div>
        </div>
      </div>
      <div className="signature text-small">
        <span>
          Made with <FontAwesomeIcon icon={solid('heart')} /> by Jackson Casey
        </span>
      </div>
    </div>
  );
}

export default App;

import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';

interface JsonSchemaConfig {
    wantToChangeInfo?: boolean;
    hasSummaryInterview?: boolean;
}

export function getJsonSchemaForType(
    schemaType: JsonSchemaType,
    prompt: string,
    maxTokens: number,
    config?: JsonSchemaConfig
) {
    const schemas = {
        [JsonSchemaType.PROJECT_HYPOTHESES]: {
            name: 'project_hypotheses',
            schema: {
                type: 'object',
                properties: {
                    hypotheses: {
                        type: 'array',
                        description: 'List of business hypotheses',
                        items: {
                            type: 'object',
                            properties: {
                                title: {
                                    type: 'string',
                                    description: 'Title of the hypothesis',
                                },
                                description: {
                                    type: 'string',
                                    description:
                                        'Detailed description of the hypothesis',
                                },
                            },
                            required: ['title', 'description'],
                            additionalProperties: false,
                        },
                        minItems: 3,
                        maxItems: 7,
                    },
                },
                required: ['hypotheses'],
                additionalProperties: false,
            },
        },
        [JsonSchemaType.HYPOTHESES_CORE_WITH_PERSON_PROFILES]: {
            name: 'hypotheses_core',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            problems: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'List of problems',
                            },
                            customerSegments: {
                                type: 'array',
                                items: {
                                    $ref: '#/$defs/customer_segment',
                                },
                            },
                            uniqueProposition: {
                                type: 'string',
                                description: 'Unique value proposition',
                            },
                            solutions: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'List of solutions',
                            },
                            keyMetrics: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Key metrics to track',
                            },
                            channels: {
                                type: 'array',
                                items: {
                                    $ref: '#/$defs/channel',
                                },
                            },
                            costStructure: {
                                type: 'string',
                                description: 'Cost structure description',
                            },
                            revenueStream: {
                                type: 'string',
                                description: 'Revenue stream description',
                            },
                            unfairAdvantages: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'List of unfair advantages',
                            },
                        },
                        required: [
                            'problems',
                            'customerSegments',
                            'uniqueProposition',
                            'solutions',
                            'keyMetrics',
                            'channels',
                            'costStructure',
                            'revenueStream',
                            'unfairAdvantages',
                        ],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
                $defs: {
                    customer_segment: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            description: { type: 'string' },
                            personProfile: {
                                $ref: '#/$defs/person_profile',
                            },
                        },
                        required: ['name', 'description', 'personProfile'],
                        additionalProperties: false,
                    },
                    person_profile: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            description: { type: 'string' },
                            platforms: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            age: { type: 'number' },
                            location: { type: 'string' },
                            education: { type: 'string' },
                            userGoals: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            userPains: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            userGains: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            userTriggers: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            jbtd: {
                                $ref: '#/$defs/jbtd',
                            },
                            cjm: {
                                $ref: '#/$defs/cjm',
                            },
                        },
                        required: [
                            'name',
                            'description',
                            'platforms',
                            'age',
                            'location',
                            'education',
                            'userGoals',
                            'userPains',
                            'userGains',
                            'userTriggers',
                            'jbtd',
                            'cjm',
                        ],
                        additionalProperties: false,
                    },
                    jbtd: {
                        type: 'object',
                        properties: {
                            functionalAspects: { type: 'string' },
                            personalDimension: { type: 'string' },
                            socialDimension: { type: 'string' },
                        },
                        required: [
                            'functionalAspects',
                            'personalDimension',
                            'socialDimension',
                        ],
                        additionalProperties: false,
                    },
                    cjm: {
                        type: 'object',
                        properties: {
                            awareness: { $ref: '#/$defs/cjm_part' },
                            consideration: { $ref: '#/$defs/cjm_part' },
                            acquisition: { $ref: '#/$defs/cjm_part' },
                            service: { $ref: '#/$defs/cjm_part' },
                            loyalty: { $ref: '#/$defs/cjm_part' },
                        },
                        required: [
                            'awareness',
                            'consideration',
                            'acquisition',
                            'service',
                            'loyalty',
                        ],
                        additionalProperties: false,
                    },
                    cjm_part: {
                        type: 'object',
                        properties: {
                            opportunities: { type: 'string' },
                            barriers: { type: 'string' },
                        },
                        required: ['opportunities', 'barriers'],
                        additionalProperties: false,
                    },
                    channel: {
                        type: 'object',
                        properties: {
                            channelType: {
                                type: 'string',
                                enum: [
                                    'ORGANIC_SEARCH',
                                    'PAID_SEARCH',
                                    'ORGANIC_SOCIAL_MEDIA',
                                    'PAID_SOCIAL_MEDIA',
                                    'PARTNERS',
                                ],
                            },
                            variants: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        url: { type: 'string' },
                                    },
                                    required: ['name', 'url'],
                                    additionalProperties: false,
                                },
                            },
                        },
                        required: ['channelType', 'variants'],
                        additionalProperties: false,
                    },
                },
            },
        },
        [JsonSchemaType.PERSON_PROFILE]: {
            name: 'person_profile',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            description: { type: 'string' },
                            platforms: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            age: { type: 'number' },
                            location: { type: 'string' },
                            education: { type: 'string' },
                            userGoals: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            userPains: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            userGains: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            userTriggers: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            jbtd: {
                                $ref: '#/$defs/jbtd',
                            },
                            cjm: {
                                $ref: '#/$defs/cjm',
                            },
                        },
                        required: [
                            'name',
                            'description',
                            'platforms',
                            'age',
                            'location',
                            'education',
                            'userGoals',
                            'userPains',
                            'userGains',
                            'userTriggers',
                            'jbtd',
                            'cjm',
                        ],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
                $defs: {
                    jbtd: {
                        type: 'object',
                        properties: {
                            functionalAspects: { type: 'string' },
                            personalDimension: { type: 'string' },
                            socialDimension: { type: 'string' },
                        },
                        required: [
                            'functionalAspects',
                            'personalDimension',
                            'socialDimension',
                        ],
                        additionalProperties: false,
                    },
                    cjm: {
                        type: 'object',
                        properties: {
                            awareness: { $ref: '#/$defs/cjm_part' },
                            consideration: { $ref: '#/$defs/cjm_part' },
                            acquisition: { $ref: '#/$defs/cjm_part' },
                            service: { $ref: '#/$defs/cjm_part' },
                            loyalty: { $ref: '#/$defs/cjm_part' },
                        },
                        required: [
                            'awareness',
                            'consideration',
                            'acquisition',
                            'service',
                            'loyalty',
                        ],
                        additionalProperties: false,
                    },
                    cjm_part: {
                        type: 'object',
                        properties: {
                            opportunities: { type: 'string' },
                            barriers: { type: 'string' },
                        },
                        required: ['opportunities', 'barriers'],
                        additionalProperties: false,
                    },
                },
            },
        },
        [JsonSchemaType.LEAN_CANVAS_MESSAGE]: {
            name: 'lean_canvas_message',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            message: {
                                type: 'string',
                                description: 'Response message to the user',
                            },
                            ...(config?.wantToChangeInfo
                                ? {
                                      problems: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      customerSegments: {
                                          type: 'array',
                                          items: {
                                              $ref: '#/$defs/customer_segment',
                                          },
                                      },
                                      uniqueProposition: { type: 'string' },
                                      solutions: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      keyMetrics: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      channels: {
                                          type: 'array',
                                          items: {
                                              $ref: '#/$defs/channel',
                                          },
                                      },
                                      costStructure: { type: 'string' },
                                      revenueStream: { type: 'string' },
                                      unfairAdvantages: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                  }
                                : {}),
                        },
                        required: config?.wantToChangeInfo
                            ? [
                                  'message',
                                  'problems',
                                  'customerSegments',
                                  'uniqueProposition',
                                  'solutions',
                                  'keyMetrics',
                                  'channels',
                                  'costStructure',
                                  'revenueStream',
                                  'unfairAdvantages',
                              ]
                            : ['message'],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
                ...(config?.wantToChangeInfo
                    ? {
                          $defs: {
                              customer_segment: {
                                  type: 'object',
                                  properties: {
                                      name: { type: 'string' },
                                      description: { type: 'string' },
                                      personProfile: {
                                          $ref: '#/$defs/person_profile',
                                      },
                                  },
                                  required: [
                                      'name',
                                      'description',
                                      'personProfile',
                                  ],
                                  additionalProperties: false,
                              },
                              person_profile: {
                                  type: 'object',
                                  properties: {
                                      name: { type: 'string' },
                                      description: { type: 'string' },
                                      platforms: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      age: { type: 'number' },
                                      location: { type: 'string' },
                                      education: { type: 'string' },
                                      userGoals: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      userPains: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      userGains: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      userTriggers: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      jbtd: { $ref: '#/$defs/jbtd' },
                                      cjm: { $ref: '#/$defs/cjm' },
                                  },
                                  required: [
                                      'name',
                                      'description',
                                      'platforms',
                                      'age',
                                      'location',
                                      'education',
                                      'userGoals',
                                      'userPains',
                                      'userGains',
                                      'userTriggers',
                                      'jbtd',
                                      'cjm',
                                  ],
                                  additionalProperties: false,
                              },
                              jbtd: {
                                  type: 'object',
                                  properties: {
                                      functionalAspects: { type: 'string' },
                                      personalDimension: { type: 'string' },
                                      socialDimension: { type: 'string' },
                                  },
                                  required: [
                                      'functionalAspects',
                                      'personalDimension',
                                      'socialDimension',
                                  ],
                                  additionalProperties: false,
                              },
                              cjm: {
                                  type: 'object',
                                  properties: {
                                      awareness: { $ref: '#/$defs/cjm_part' },
                                      consideration: {
                                          $ref: '#/$defs/cjm_part',
                                      },
                                      acquisition: { $ref: '#/$defs/cjm_part' },
                                      service: { $ref: '#/$defs/cjm_part' },
                                      loyalty: { $ref: '#/$defs/cjm_part' },
                                  },
                                  required: [
                                      'awareness',
                                      'consideration',
                                      'acquisition',
                                      'service',
                                      'loyalty',
                                  ],
                                  additionalProperties: false,
                              },
                              cjm_part: {
                                  type: 'object',
                                  properties: {
                                      opportunities: { type: 'string' },
                                      barriers: { type: 'string' },
                                  },
                                  required: ['opportunities', 'barriers'],
                                  additionalProperties: false,
                              },
                              channel: {
                                  type: 'object',
                                  properties: {
                                      channelType: {
                                          type: 'string',
                                          enum: [
                                              'ORGANIC_SEARCH',
                                              'PAID_SEARCH',
                                              'ORGANIC_SOCIAL_MEDIA',
                                              'PAID_SOCIAL_MEDIA',
                                              'PARTNERS',
                                          ],
                                      },
                                      variants: {
                                          type: 'array',
                                          items: {
                                              type: 'object',
                                              properties: {
                                                  name: { type: 'string' },
                                                  url: { type: 'string' },
                                              },
                                              required: ['name', 'url'],
                                              additionalProperties: false,
                                          },
                                      },
                                  },
                                  required: ['channelType', 'variants'],
                                  additionalProperties: false,
                              },
                          },
                      }
                    : {}),
            },
        },
        [JsonSchemaType.PERSON_PROFILE_MESSAGE]: {
            name: 'person_profile_message',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            message: {
                                type: 'string',
                                description: 'Response message to the user',
                            },
                            ...(config?.wantToChangeInfo
                                ? {
                                      name: { type: 'string' },
                                      description: { type: 'string' },
                                      platforms: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      age: { type: 'number' },
                                      location: { type: 'string' },
                                      education: { type: 'string' },
                                      userGoals: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      userPains: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      userGains: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      userTriggers: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      jbtd: { $ref: '#/$defs/jbtd' },
                                      cjm: { $ref: '#/$defs/cjm' },
                                  }
                                : {}),
                        },
                        required: config?.wantToChangeInfo
                            ? [
                                  'message',
                                  'name',
                                  'description',
                                  'platforms',
                                  'age',
                                  'location',
                                  'education',
                                  'userGoals',
                                  'userPains',
                                  'userGains',
                                  'userTriggers',
                                  'jbtd',
                                  'cjm',
                              ]
                            : ['message'],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
                ...(config?.wantToChangeInfo
                    ? {
                          $defs: {
                              jbtd: {
                                  type: 'object',
                                  properties: {
                                      functionalAspects: { type: 'string' },
                                      personalDimension: { type: 'string' },
                                      socialDimension: { type: 'string' },
                                  },
                                  required: [
                                      'functionalAspects',
                                      'personalDimension',
                                      'socialDimension',
                                  ],
                                  additionalProperties: false,
                              },
                              cjm: {
                                  type: 'object',
                                  properties: {
                                      awareness: { $ref: '#/$defs/cjm_part' },
                                      consideration: {
                                          $ref: '#/$defs/cjm_part',
                                      },
                                      acquisition: { $ref: '#/$defs/cjm_part' },
                                      service: { $ref: '#/$defs/cjm_part' },
                                      loyalty: { $ref: '#/$defs/cjm_part' },
                                  },
                                  required: [
                                      'awareness',
                                      'consideration',
                                      'acquisition',
                                      'service',
                                      'loyalty',
                                  ],
                                  additionalProperties: false,
                              },
                              cjm_part: {
                                  type: 'object',
                                  properties: {
                                      opportunities: { type: 'string' },
                                      barriers: { type: 'string' },
                                  },
                                  required: ['opportunities', 'barriers'],
                                  additionalProperties: false,
                              },
                          },
                      }
                    : {}),
            },
        },
        [JsonSchemaType.HYPOTHESES_MARKET_RESEARCH]: {
            name: 'hypotheses_market_research',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            summary: {
                                type: 'string',
                                description:
                                    'Comprehensive market research summary',
                            },
                        },
                        required: ['summary'],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
            },
        },
        [JsonSchemaType.MARKET_RESEARCH_MESSAGE]: {
            name: 'market_research_message',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            message: {
                                type: 'string',
                                description: 'Response message to the user',
                            },
                            ...(config?.wantToChangeInfo
                                ? {
                                      summary: { type: 'string' },
                                  }
                                : {}),
                        },
                        required: config?.wantToChangeInfo
                            ? ['message', 'summary']
                            : ['message'],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
            },
        },
        [JsonSchemaType.HYPOTHESES_VALIDATION]: {
            name: 'hypotheses_validation',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            validationChannels: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Channels for finding respondents',
                            },
                            customerInterviewQuestions: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Interview questions list',
                            },
                        },
                        required: [
                            'validationChannels',
                            'customerInterviewQuestions',
                        ],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
            },
        },
        [JsonSchemaType.VALIDATION_INSIGHTS_CUSTOMER_INTERVIEWS]: {
            name: 'validation_insights',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            insightsCustomerInterviews: {
                                type: 'string',
                                description: 'Analysis insights from interviews',
                            },
                            summaryInterview: {
                                type: 'object',
                                properties: {
                                    goals: {
                                        type: 'array',
                                        items: { type: 'string' },
                                    },
                                    pains: {
                                        type: 'array',
                                        items: { type: 'string' },
                                    },
                                    hypotheses: {
                                        type: 'array',
                                        items: { type: 'string' },
                                    },
                                    toneOfVoice: { type: 'string' },
                                },
                                required: [
                                    'goals',
                                    'pains',
                                    'hypotheses',
                                    'toneOfVoice',
                                ],
                                additionalProperties: false,
                            },
                        },
                        required: [
                            'insightsCustomerInterviews',
                            'summaryInterview',
                        ],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
            },
        },
        [JsonSchemaType.VALIDATION_MESSAGE]: {
            name: 'validation_message',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            message: {
                                type: 'string',
                                description: 'Response message to the user',
                            },
                            ...(config?.wantToChangeInfo
                                ? {
                                      validationChannels: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      customerInterviewQuestions: {
                                          type: 'array',
                                          items: { type: 'string' },
                                      },
                                      ...(config?.hasSummaryInterview
                                          ? {
                                                summaryInterview: {
                                                    type: 'object',
                                                    properties: {
                                                        goals: {
                                                            type: 'array',
                                                            items: {
                                                                type: 'string',
                                                            },
                                                        },
                                                        pains: {
                                                            type: 'array',
                                                            items: {
                                                                type: 'string',
                                                            },
                                                        },
                                                        hypotheses: {
                                                            type: 'array',
                                                            items: {
                                                                type: 'string',
                                                            },
                                                        },
                                                        toneOfVoice: {
                                                            type: 'string',
                                                        },
                                                    },
                                                    required: [
                                                        'goals',
                                                        'pains',
                                                        'hypotheses',
                                                        'toneOfVoice',
                                                    ],
                                                    additionalProperties: false,
                                                },
                                            }
                                          : {}),
                                  }
                                : {}),
                        },
                        required: config?.wantToChangeInfo
                            ? config?.hasSummaryInterview
                                ? [
                                      'message',
                                      'validationChannels',
                                      'customerInterviewQuestions',
                                      'summaryInterview',
                                  ]
                                : [
                                      'message',
                                      'validationChannels',
                                      'customerInterviewQuestions',
                                  ]
                            : ['message'],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
            },
        },
        [JsonSchemaType.HYPOTHESES_PACKING]: {
            name: 'hypotheses_packing',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            summary: {
                                type: 'string',
                                description: 'Product packing summary',
                            },
                        },
                        required: ['summary'],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
            },
        },
        [JsonSchemaType.PACKING_MESSAGE]: {
            name: 'packing_message',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            message: {
                                type: 'string',
                                description: 'Response message to the user',
                            },
                            ...(config?.wantToChangeInfo
                                ? {
                                      summary: { type: 'string' },
                                  }
                                : {}),
                        },
                        required: config?.wantToChangeInfo
                            ? ['message', 'summary']
                            : ['message'],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
            },
        },
        [JsonSchemaType.HYPOTHESES_GTM]: {
            name: 'hypotheses_gtm',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            stageValidate: {
                                $ref: '#/$defs/gtm_stage',
                            },
                            stageBuildAudience: {
                                $ref: '#/$defs/gtm_stage',
                            },
                            stageScale: {
                                $ref: '#/$defs/gtm_stage',
                            },
                        },
                        required: [
                            'stageValidate',
                            'stageBuildAudience',
                            'stageScale',
                        ],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
                $defs: {
                    gtm_stage: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                                description:
                                    'Stage name: Validate, Build Audience, or Scale',
                            },
                            channels: {
                                type: 'array',
                                items: {
                                    $ref: '#/$defs/gtm_channel',
                                },
                                minItems: 3,
                                maxItems: 3,
                            },
                        },
                        required: ['name', 'channels'],
                        additionalProperties: false,
                    },
                    gtm_channel: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            type: {
                                type: 'string',
                                enum: [
                                    'ORGANIC_SEARCH',
                                    'PAID_SEARCH',
                                    'ORGANIC_SOCIAL_MEDIA',
                                    'PAID_SOCIAL_MEDIA',
                                    'PARTNERS',
                                ],
                            },
                            description: { type: 'string' },
                            kpis: {
                                type: 'string',
                                description: 'Key performance indicators',
                            },
                            status: {
                                type: 'string',
                                enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED'],
                            },
                            strategy: { type: 'string' },
                        },
                        required: [
                            'name',
                            'type',
                            'description',
                            'kpis',
                            'status',
                            'strategy',
                        ],
                        additionalProperties: false,
                    },
                },
            },
        },
        [JsonSchemaType.GTM_MESSAGE]: {
            name: 'gtm_message',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            message: {
                                type: 'string',
                                description: 'Response message to the user',
                            },
                            ...(config?.wantToChangeInfo
                                ? {
                                      stageValidate: {
                                          $ref: '#/$defs/gtm_stage',
                                      },
                                      stageBuildAudience: {
                                          $ref: '#/$defs/gtm_stage',
                                      },
                                      stageScale: {
                                          $ref: '#/$defs/gtm_stage',
                                      },
                                  }
                                : {}),
                        },
                        required: config?.wantToChangeInfo
                            ? [
                                  'message',
                                  'stageValidate',
                                  'stageBuildAudience',
                                  'stageScale',
                              ]
                            : ['message'],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
                ...(config?.wantToChangeInfo
                    ? {
                          $defs: {
                              gtm_stage: {
                                  type: 'object',
                                  properties: {
                                      name: { type: 'string' },
                                      channels: {
                                          type: 'array',
                                          items: {
                                              $ref: '#/$defs/gtm_channel',
                                          },
                                          minItems: 3,
                                          maxItems: 3,
                                      },
                                  },
                                  required: ['name', 'channels'],
                                  additionalProperties: false,
                              },
                              gtm_channel: {
                                  type: 'object',
                                  properties: {
                                      name: { type: 'string' },
                                      type: {
                                          type: 'string',
                                          enum: [
                                              'ORGANIC_SEARCH',
                                              'PAID_SEARCH',
                                              'ORGANIC_SOCIAL_MEDIA',
                                              'PAID_SOCIAL_MEDIA',
                                              'PARTNERS',
                                          ],
                                      },
                                      description: { type: 'string' },
                                      kpis: { type: 'string' },
                                      status: {
                                          type: 'string',
                                          enum: [
                                              'PLANNED',
                                              'IN_PROGRESS',
                                              'COMPLETED',
                                          ],
                                      },
                                      strategy: { type: 'string' },
                                  },
                                  required: [
                                      'name',
                                      'type',
                                      'description',
                                      'kpis',
                                      'status',
                                      'strategy',
                                  ],
                                  additionalProperties: false,
                              },
                          },
                      }
                    : {}),
            },
        },
        [JsonSchemaType.GTM_DETAILED_CHANNEL_MESSAGE]: {
            name: 'gtm_detailed_channel_message',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            message: {
                                type: 'string',
                                description: 'Response message to the user',
                            },
                            ...(config?.wantToChangeInfo
                                ? {
                                      channelStrategy: { type: 'string' },
                                      channelPreparationTasks: {
                                          type: 'array',
                                          items: {
                                              $ref: '#/$defs/text_is_completed',
                                          },
                                      },
                                      tools: { type: 'string' },
                                      resources: { type: 'string' },
                                      contentIdeas: {
                                          type: 'array',
                                          items: {
                                              $ref: '#/$defs/content_idea',
                                          },
                                      },
                                      actionPlan: {
                                          type: 'array',
                                          items: {
                                              $ref: '#/$defs/action_plan',
                                          },
                                      },
                                      metricsAndKpis: {
                                          type: 'array',
                                          items: {
                                              $ref: '#/$defs/metrics_and_kpis',
                                          },
                                      },
                                  }
                                : {}),
                        },
                        required: config?.wantToChangeInfo
                            ? [
                                  'message',
                                  'channelStrategy',
                                  'channelPreparationTasks',
                                  'tools',
                                  'resources',
                                  'contentIdeas',
                                  'actionPlan',
                                  'metricsAndKpis',
                              ]
                            : ['message'],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
                ...(config?.wantToChangeInfo
                    ? {
                          $defs: {
                              text_is_completed: {
                                  type: 'object',
                                  properties: {
                                      text: { type: 'string' },
                                      isCompleted: { type: 'boolean' },
                                  },
                                  required: ['text', 'isCompleted'],
                                  additionalProperties: false,
                              },
                              content_idea: {
                                  type: 'object',
                                  properties: {
                                      title: { type: 'string' },
                                      text: { type: 'string' },
                                  },
                                  required: ['title', 'text'],
                                  additionalProperties: false,
                              },
                              action_plan: {
                                  type: 'object',
                                  properties: {
                                      stageTitle: { type: 'string' },
                                      tasks: {
                                          type: 'array',
                                          items: {
                                              $ref: '#/$defs/text_is_completed',
                                          },
                                      },
                                      isCompleted: { type: 'boolean' },
                                  },
                                  required: [
                                      'stageTitle',
                                      'tasks',
                                      'isCompleted',
                                  ],
                                  additionalProperties: false,
                              },
                              metrics_and_kpis: {
                                  type: 'object',
                                  properties: {
                                      key: { type: 'string' },
                                      value: { type: 'string' },
                                  },
                                  required: ['key', 'value'],
                                  additionalProperties: false,
                              },
                          },
                      }
                    : {}),
            },
        },
        [JsonSchemaType.HYPOTHESES_GTM_DETAILED_CHANNEL]: {
            name: 'hypotheses_gtm_detailed_channel',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            channelStrategy: {
                                type: 'string',
                                description: 'Detailed channel strategy',
                            },
                            channelPreparationTasks: {
                                type: 'array',
                                items: {
                                    $ref: '#/$defs/text_is_completed',
                                },
                            },
                            tools: {
                                type: 'string',
                                description:
                                    'Tools needed, formatted with newlines',
                            },
                            resources: {
                                type: 'string',
                                description:
                                    'Resources needed, formatted with newlines',
                            },
                            contentIdeas: {
                                type: 'array',
                                items: {
                                    $ref: '#/$defs/content_idea',
                                },
                            },
                            actionPlan: {
                                type: 'array',
                                items: {
                                    $ref: '#/$defs/action_plan',
                                },
                            },
                            metricsAndKpis: {
                                type: 'array',
                                items: {
                                    $ref: '#/$defs/metrics_and_kpis',
                                },
                            },
                        },
                        required: [
                            'channelStrategy',
                            'channelPreparationTasks',
                            'tools',
                            'resources',
                            'contentIdeas',
                            'actionPlan',
                            'metricsAndKpis',
                        ],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
                $defs: {
                    text_is_completed: {
                        type: 'object',
                        properties: {
                            text: { type: 'string' },
                            isCompleted: { type: 'boolean' },
                        },
                        required: ['text', 'isCompleted'],
                        additionalProperties: false,
                    },
                    content_idea: {
                        type: 'object',
                        properties: {
                            title: { type: 'string' },
                            text: { type: 'string' },
                        },
                        required: ['title', 'text'],
                        additionalProperties: false,
                    },
                    action_plan: {
                        type: 'object',
                        properties: {
                            stageTitle: { type: 'string' },
                            tasks: {
                                type: 'array',
                                items: {
                                    $ref: '#/$defs/text_is_completed',
                                },
                            },
                            isCompleted: { type: 'boolean' },
                        },
                        required: ['stageTitle', 'tasks', 'isCompleted'],
                        additionalProperties: false,
                    },
                    metrics_and_kpis: {
                        type: 'object',
                        properties: {
                            key: { type: 'string' },
                            value: { type: 'string' },
                        },
                        required: ['key', 'value'],
                        additionalProperties: false,
                    },
                },
            },
        },
        [JsonSchemaType.GENERATE_CONTENT_IDEA]: {
            name: 'generate_content_idea',
            schema: {
                type: 'object',
                properties: {
                    response: {
                        type: 'object',
                        properties: {
                            title: {
                                type: 'string',
                                description: 'Content idea title',
                            },
                            text: {
                                type: 'string',
                                description: 'Content idea description/text',
                            },
                        },
                        required: ['title', 'text'],
                        additionalProperties: false,
                    },
                },
                required: ['response'],
                additionalProperties: false,
            },
        },
    };

    const selectedSchema = schemas[schemaType];

    return {
        model: 'gpt-4.1-mini',
        input: [
            {
                role: 'user',
                content: prompt,
            },
        ],
        text: {
            format: {
                type: 'json_schema',
                name: selectedSchema.name,
                strict: true,
                schema: selectedSchema.schema,
            },
        },
        tools: [],
        temperature: 1,
        max_output_tokens: maxTokens,
        top_p: 1,
        store: true,
    };
}

